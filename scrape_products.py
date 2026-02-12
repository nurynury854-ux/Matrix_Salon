#!/usr/bin/env python3
import re
import urllib.request
import json
import time

def scrape_products():
    """Scrape all products from amosprofessional.mn"""
    products = []
    page = 1
    max_pages = 20  # safety limit
    
    print("Starting product scrape...")
    
    while page <= max_pages:
        url = f"https://amosprofessional.mn/products?page={page}"
        print(f"\nFetching page {page}: {url}")
        
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            html = urllib.request.urlopen(req).read().decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"Error fetching page {page}: {e}")
            break
        
        # Extract all product blocks
        # Pattern: <a href="/products/ID" class="product-title ...>NAME</a>...category...price
        blocks = re.findall(
            r'<a href="/products/(\d+)" class="product-title.*?>([^<]+)</a>\s*.*?'
            r'<a href="#" class="product-category fw-normal.*?>([^<]+)</a>\s*.*?'
            r'<h5 class="product-product-price.*?>([0-9,]+)<span class="currency">₮</span>',
            html,
            re.DOTALL | re.IGNORECASE
        )
        
        print(f"Found {len(blocks)} products on page {page}")
        
        if not blocks:
            print("No products found on this page, stopping")
            break
        
        for product_id, name, category, price in blocks:
            price_clean = int(price.replace(",", ""))
            
            # Construct product object
            product = {
                "id": int(product_id),
                "name": name.strip(),
                "price": price_clean,
                "category": category.strip(),
                "url": f"https://amosprofessional.mn/products/{product_id}",
                "image": f"Products/{name.strip()}.jpg"  # Placeholder - user will update with real images
            }
            
            products.append(product)
        
        # Check if last page based on "next_page" presence
        if "next_page" not in html or f"page={page+1}" not in html:
            print("Reached last page")
            break
        
        page += 1
        time.sleep(0.5)  # Be polite
    
    print(f"\n✓ Total products scraped: {len(products)}")
    return products

def save_products(products, filepath):
    """Save products to JSON file"""
    data = {"products": products}
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"✓ Saved to {filepath}")

if __name__ == "__main__":
    products = scrape_products()
    save_products(products, "/Users/Nury/Desktop/Matrix_Salon/data/products.json")
