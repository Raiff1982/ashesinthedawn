## ?? Quick Test Commands

### Run All Tests
```bash
python run_tests.py
```

### Run Tests in Verbose Mode
```bash
python run_tests.py -v
```

### Run Specific Test File
```bash
python run_tests.py Codette/tests/test_response_verifier.py -v
```

### Run Specific Test Class
```bash
python run_tests.py Codette/tests/test_response_verifier.py::TestResponseVerifier -v
```

### Run Specific Test Method
```bash
python run_tests.py Codette/tests/test_response_verifier.py::TestResponseVerifier::test_verify_insight -v
```

### Run with Coverage Report
```bash
python run_tests.py --cov=Codette/src --cov-report=html
```

### Run Only Failing Tests
```bash
python run_tests.py --lf
```

### Run Only Fast Tests
```bash
python run_tests.py -m "not slow"
```

---

## ?? Test Files

| Test File | Tests | Purpose |
|-----------|-------|---------|
| `test_response_verifier.py` | 6 | Response verification with grounding truth |
| `test_cocoon_manager.py` | 5 | Memory cocoon management |
| `test_response_processor.py` | 4 | Response processing pipeline |
| `test_grounding_truth.py` | 1 | Grounding truth verification system |

**Total**: 16 unit tests

---

## ? Expected Results

```
======================== 16 passed in 1.23s ========================
```

---

## ?? Related Files
- `docs/TEST_SUITE_FIX.md` - Detailed fix documentation
- `docs/CODEMAP.md` - Workspace structure overview
- `conftest.py` - pytest configuration
- `pytest.ini` - pytest settings
- `run_tests.py` - Test runner script
