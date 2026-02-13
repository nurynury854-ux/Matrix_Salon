import json

with open('data/products.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Check for newlines in names
newline_count = 0
for i, prod in enumerate(data['products'], 1):
    name = prod.get('name', '')
    if '\n' in name:
        newline_count += 1
        if newline_count <= 5:
            print(f"Product {i}: {repr(name[:60])}")

print(f"\nTotal products with newlines: {newline_count}")

# Fix them if found
if newline_count > 0:
    for prod in data['products']:
        name = prod.get('name', '')
        if '\n' in name:
            prod['name'] = name.replace('\n', ' ').strip()
    
    with open('data/products.json', 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"✅ Fixed {newline_count} products with newlines in names")
