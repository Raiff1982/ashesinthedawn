"""Fix UTF-8 encoding in codette_new.py"""

# Read file in binary mode
with open('Codette/codette_new.py', 'rb') as f:
    content = f.read()

# Replace Windows-1252 bullet (\x95) with UTF-8 bullet (•)
fixed_content = content.replace(b'\x95', '•'.encode('utf-8'))

# Write back with UTF-8 encoding
with open('Codette/codette_new.py', 'wb') as f:
    f.write(fixed_content)

print("? Fixed UTF-8 encoding issue in codette_new.py")
print("? Replaced Windows-1252 bullet (\\x95) with UTF-8 bullet (•)")
