"""
Codette v3 Fine-Tuning Module
Enables model fine-tuning on domain-specific data for improved performance.
Implements transfer learning, adapter patterns, and LoRA.
"""

import os
import json
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from dataclasses import dataclass
import torch
from torch.utils.data import DataLoader, Dataset
from transformers import (
    Trainer,
    TrainingArguments,
    AutoModelForCausalLM,
    AutoTokenizer,
    TextDataset,
    DataCollatorForLanguageModeling
)

try:
    from peft import LoraConfig, get_peft_model, TaskType
    LORA_AVAILABLE = True
except ImportError:
    LORA_AVAILABLE = False
    logging.warning("peft not installed. LoRA fine-tuning will be unavailable.")

logger = logging.getLogger(__name__)


@dataclass
class FineTuningConfig:
    """Configuration for fine-tuning."""
    model_name: str
    output_dir: str
    training_data_path: str
    learning_rate: float = 5e-5
    batch_size: int = 8
    epochs: int = 3
    warmup_steps: int = 100
    weight_decay: float = 0.01
    max_grad_norm: float = 1.0
    use_lora: bool = False
    lora_rank: int = 8
    lora_alpha: int = 16
    lora_dropout: float = 0.05
    save_strategy: str = "epoch"
    eval_strategy: str = "epoch"
    save_total_limit: int = 3
    device: str = "cuda" if torch.cuda.is_available() else "cpu"
    
    def to_dict(self) -> Dict:
        """Convert to dictionary."""
        return {
            'model_name': self.model_name,
            'output_dir': self.output_dir,
            'training_data_path': self.training_data_path,
            'learning_rate': self.learning_rate,
            'batch_size': self.batch_size,
            'epochs': self.epochs,
            'warmup_steps': self.warmup_steps,
            'weight_decay': self.weight_decay,
            'max_grad_norm': self.max_grad_norm,
            'use_lora': self.use_lora,
            'lora_rank': self.lora_rank,
            'lora_alpha': self.lora_alpha,
            'lora_dropout': self.lora_dropout,
            'device': self.device
        }


class CustomAudioDataset(Dataset):
    """Dataset for audio analysis fine-tuning."""
    
    def __init__(
        self,
        data_file: str,
        tokenizer: Any,
        max_length: int = 512
    ):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.examples = []
        self.load_data(data_file)
    
    def load_data(self, data_file: str) -> None:
        """Load JSON Lines format data."""
        if not Path(data_file).exists():
            raise FileNotFoundError(f"Data file not found: {data_file}")
        
        with open(data_file, 'r') as f:
            for line in f:
                if line.strip():
                    example = json.loads(line)
                    self.examples.append(example)
        
        logger.info(f"Loaded {len(self.examples)} examples")
    
    def __len__(self) -> int:
        return len(self.examples)
    
    def __getitem__(self, idx: int) -> Dict[str, torch.Tensor]:
        example = self.examples[idx]
        
        # Format: query + response
        text = f"{example.get('query', '')} {example.get('response', '')}"
        
        encodings = self.tokenizer(
            text,
            max_length=self.max_length,
            truncation=True,
            padding='max_length',
            return_tensors='pt'
        )
        
        return {
            'input_ids': encodings['input_ids'].squeeze(),
            'attention_mask': encodings['attention_mask'].squeeze(),
            'labels': encodings['input_ids'].squeeze()
        }


class CodetteFinetuner:
    """
    Fine-tuning engine for Codette models.
    Supports LoRA, full fine-tuning, and adapter patterns.
    """
    
    def __init__(self, config: FineTuningConfig):
        self.config = config
        self.model = None
        self.tokenizer = None
        self.trainer = None
        
        Path(self.config.output_dir).mkdir(parents=True, exist_ok=True)
        
        # Save config
        self._save_config()
        
        logger.info(f"CodetteFinetuner initialized with config:\n{config.to_dict()}")
    
    def _save_config(self) -> None:
        """Save fine-tuning configuration."""
        config_path = Path(self.config.output_dir) / "finetuning_config.json"
        with open(config_path, 'w') as f:
            json.dump(self.config.to_dict(), f, indent=2)
    
    def load_model_and_tokenizer(self) -> bool:
        """Load model and tokenizer."""
        try:
            logger.info(f"Loading model: {self.config.model_name}")
            
            self.tokenizer = AutoTokenizer.from_pretrained(self.config.model_name)
            
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.config.model_name,
                device_map=self.config.device,
                torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
            )
            
            logger.info("Model and tokenizer loaded successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error loading model: {e}")
            return False
    
    def apply_lora(self) -> bool:
        """Apply LoRA adapters to the model."""
        if not LORA_AVAILABLE:
            logger.warning("peft not available. Cannot apply LoRA.")
            return False
        
        try:
            logger.info("Applying LoRA configuration...")
            
            config = LoraConfig(
                r=self.config.lora_rank,
                lora_alpha=self.config.lora_alpha,
                target_modules=["q_proj", "v_proj"],
                lora_dropout=self.config.lora_dropout,
                bias="none",
                task_type=TaskType.CAUSAL_LM
            )
            
            self.model = get_peft_model(self.model, config)
            self.model.print_trainable_parameters()
            
            logger.info("LoRA applied successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error applying LoRA: {e}")
            return False
    
    def prepare_training_arguments(self) -> TrainingArguments:
        """Prepare Hugging Face training arguments."""
        return TrainingArguments(
            output_dir=self.config.output_dir,
            overwrite_output_dir=True,
            num_train_epochs=self.config.epochs,
            per_device_train_batch_size=self.config.batch_size,
            per_device_eval_batch_size=self.config.batch_size,
            warmup_steps=self.config.warmup_steps,
            weight_decay=self.config.weight_decay,
            logging_dir=f"{self.config.output_dir}/logs",
            logging_steps=100,
            learning_rate=self.config.learning_rate,
            save_strategy=self.config.save_strategy,
            evaluation_strategy=self.config.eval_strategy,
            save_total_limit=self.config.save_total_limit,
            max_grad_norm=self.config.max_grad_norm,
            fp16=torch.cuda.is_available(),
            gradient_accumulation_steps=1,
            load_best_model_at_end=True,
            metric_for_best_model="loss"
        )
    
    def prepare_data_loaders(self) -> Tuple[DataLoader, DataLoader]:
        """Prepare training and evaluation data loaders."""
        dataset = CustomAudioDataset(
            self.config.training_data_path,
            self.tokenizer
        )
        
        # Split into train/eval
        train_size = int(0.9 * len(dataset))
        eval_size = len(dataset) - train_size
        
        train_dataset, eval_dataset = torch.utils.data.random_split(
            dataset,
            [train_size, eval_size]
        )
        
        logger.info(f"Train size: {train_size}, Eval size: {eval_size}")
        
        return train_dataset, eval_dataset
    
    def fine_tune(self) -> bool:
        """Execute fine-tuning."""
        try:
            # Load model
            if not self.load_model_and_tokenizer():
                return False
            
            # Apply LoRA if configured
            if self.config.use_lora and not self.apply_lora():
                logger.warning("LoRA not available, proceeding with full fine-tuning")
            
            # Prepare data
            train_dataset, eval_dataset = self.prepare_data_loaders()
            
            # Prepare training arguments
            training_args = self.prepare_training_arguments()
            
            # Initialize trainer
            self.trainer = Trainer(
                model=self.model,
                args=training_args,
                train_dataset=train_dataset,
                eval_dataset=eval_dataset,
                data_collator=DataCollatorForLanguageModeling(
                    tokenizer=self.tokenizer,
                    mlm=False
                )
            )
            
            # Start training
            logger.info("Starting fine-tuning...")
            result = self.trainer.train()
            
            # Save final model
            self.save_model()
            
            logger.info(f"Fine-tuning completed. Results: {result}")
            return True
            
        except Exception as e:
            logger.error(f"Error during fine-tuning: {e}")
            return False
    
    def save_model(self) -> bool:
        """Save fine-tuned model."""
        try:
            if self.model is None:
                logger.error("No model to save")
                return False
            
            output_path = Path(self.config.output_dir) / "final_model"
            output_path.mkdir(parents=True, exist_ok=True)
            
            self.model.save_pretrained(str(output_path))
            self.tokenizer.save_pretrained(str(output_path))
            
            logger.info(f"Model saved to {output_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error saving model: {e}")
            return False
    
    def evaluate(self) -> Dict[str, float]:
        """Evaluate the model."""
        if self.trainer is None:
            logger.error("Trainer not initialized")
            return {}
        
        try:
            results = self.trainer.evaluate()
            logger.info(f"Evaluation results: {results}")
            return results
        except Exception as e:
            logger.error(f"Error evaluating: {e}")
            return {}


def create_training_data_example(
    output_file: str,
    num_examples: int = 100
) -> None:
    """Create example training data in JSONL format."""
    examples = [
        {
            "query": "Analyze the audio frequency spectrum",
            "response": "The audio contains frequencies ranging from 20Hz to 20kHz with dominant peaks at 440Hz (A4) and harmonics."
        },
        {
            "query": "What is the audio quality?",
            "response": "The audio has a quality rating of 4.5/5.0 with good frequency response and minimal distortion."
        },
        {
            "query": "Describe the audio characteristics",
            "response": "The audio shows characteristics of a piano recording with clear attack, sustained tone, and natural decay."
        }
    ]
    
    with open(output_file, 'w') as f:
        for _ in range(num_examples):
            for example in examples:
                f.write(json.dumps(example) + '\n')
    
    logger.info(f"Created {num_examples * len(examples)} training examples in {output_file}")


if __name__ == "__main__":
    # Example usage
    config = FineTuningConfig(
        model_name="microsoft/phi-2",
        output_dir="./codette_finetuned",
        training_data_path="./training_data.jsonl",
        learning_rate=5e-5,
        batch_size=8,
        epochs=3,
        use_lora=True
    )
    
    # Create example training data
    create_training_data_example("./training_data.jsonl", num_examples=100)
    
    # Fine-tune
    finetuner = CodetteFinetuner(config)
    finetuner.fine_tune()
