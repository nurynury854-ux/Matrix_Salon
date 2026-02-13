#!/usr/bin/env python3
"""
Rename descriptive-named product images to product_ID format
and update products.json to point to them.
"""
import os, json, shutil

PRODUCTS_DIR = "Products"
JSON_PATH = "data/products.json"

# Manual mapping: descriptive filename -> product ID
# Built by matching the first words of each filename to the product name in products.json
RENAME_MAP = {
    # Асуудлын цогц шийдэл (combo sets)
    "Индүү, сэнс хэрэглэдэг гэмтэлтэй, бүдүүн.jpg":                           583870,
    "Индүү, сэнс хэрэглэдэг гэмтэлтэй, нарийн.jpg":                            583858,
    "Эмзэг мэдрэмтгий хуйхтай үс уналттай, хэт.jpg":                           583855,

    # 01 COLOR&PERM
    "01 COLOR&PERM SHAMPOO, CONDITIONER.jpg":                                     578458,

    # 02 PURE SMART (scalp)
    "02 PURE SMART Тослог хаг, загатнаж хөлөрдөг, эвгүй.jpg":                   578335,
    "02 PURE SMART Тослогтдог, жижиг бужигнасан хаганд зориулсан шампунь.jpg":   578334,
    "02 PURE SMART Тослогтдог, жижиг.jpg":                                       578349,
    "02 PURE SMART Хагны эсрэг чийгшүүлж,.webp":                                 578336,
    "02 PURE SMART Хуурайшдаг, загатнаа.jpg":                                    578333,

    # 02 THE GREEN TEA (hair loss)
    "02 THE GREEN TEA Тослог хуйханд зориулсан үс.jpg":                          578330,
    "02 THE GREEN TEA Хуурай болон энгийн хуйханд.jpg":                           580135,
    "02 THE GREEN TEA Эмзэг, мэдрэмтгий хуйханд зориулсан багц - Amos Professional .jpg": 578327,
    "02 THE GREEN TEA Эмзэг, мэдрэмтгий хуйханд.jpg":                           578325,
    "02 THE GREEN TEA Энгийн болон хуурай үс уналттай.jpg":                       577948,
    "02 THE GREEN TEA Үс уналтын эсрэг тослог.jpg":                              578302,
    "02 THE GREEN TEA Үс уналтын эсрэг хуйхны серум .webp":                      578303,
    "02 THE GREEN TEA Үс уналтын эсрэг хуйхны.jpg":                              578324,

    # 03 SILKY RADIANCE (colored hair)
    "03 SILKY RADIANCE Будагтай үс арчилгааны багц.jpg":                          578396,
    "03 SILKY RADIANCE Будагтай үс арчилгааны шампунь -.webp":                    578431,
    "03 SILKY RADIANCE Будагтай үс арчилгааны.jpg":                               578435,
    "03 SILKY RADIANCE Будагтай үсний ойл -.jpg":                                 578432,

    # 04 CURLING
    "04 CURLING ESSENCE 2X 150мл Тоорын үнэртэй.jpg":                            579445,
    "04 CURLING ESSENCE 2X 150мл Цэцгийн үнэртэй.jpg":                           579444,

    # 05 REPAIR CICA (severely damaged hair)
    "05 REPAIR CICA Хэт гэмтэлтэй үсний багц -.jpg":                            578104,
    "05 REPAIR CICA Хэт гэмтэлтэй үсний тэжээл -.jpg":                          578356,
    "05 REPAIR CICA Хэт гэмтэлтэй үсний цацдаг.jpg":                            578357,
    "05 REPAIR CICA Хэт гэмтэлтэй үсний шампунь.webp":                           578354,
    "05 REPAIR CICA Хэт гэмтэлтэй үсний үзүүрийн.jpg":                          578359,

    # 05 REPAIR CMC (chemically damaged hair)
    "05 REPAIR CMC Химитэй, гэмтэлтэй үсний багц -.jpg":                        578361,
    "05 REPAIR CMC Химитэй, гэмтэлтэй үсний ойл -.jpg":                         578368,
    "05 REPAIR CMC Химитэй, гэмтэлтэй үсний тэжээл -.jpg":                      578366,
    "05 REPAIR CMC Химитэй, гэмтэлтэй үсний шампунь.jpg":                        578363,

    # 06 RENEW CAMELLIA (scalp aging)
    "06 RENEW CAMELLIA Тослог хуйхны.jpg":                                        579424,
    "06 RENEW CAMELLIA Тослог хуйханд зориулса.jpg":                              579420,
    "06 RENEW CAMELLIA Хуйх чангалах, хуйхны.webp":                               579425,
    "06 RENEW CAMELLIA Хуйхны хөгшрөлтийн.jpg":                                   579432,
    "06 RENEW CAMELLIA Хуйхны хөгшрөлтийн.webp":                                  579426,
    "06 RENEW CAMELLIA Хуурай хуйхны.jpg":                                         579423,
    "06 RENEW CAMELLIA Энгийн болон хуурай.jpg":                                   579421,

    # BOTANIC CALM (Amos Global)
    "BOTANIC CALM Үсний ургалт дэмжиж өтгөрүүлэх багц -.webp":                   581098,
    "BOTANIC CALM Үсний ургалт дэмжиж өтгөрүүлэх шампунь.webp":                   581100,
    "BOTANIC CALM Үсний ургалт дэмжиж өтгөрүүлэх.webp":                           581136,

    # GREEN TEA ACTIVE (Amos Global)
    "GREEN TEA ACTIVE Клиник үс уналтын эсрэг булцуу.webp":                       582651,
}

# ── Run ──────────────────────────────────────────────────────────────
with open(JSON_PATH, "r", encoding="utf-8") as f:
    data = json.load(f)

products_by_id = {p["id"]: p for p in data["products"]}

renamed = 0
skipped = []
json_updated = 0

for old_name, pid in RENAME_MAP.items():
    old_path = os.path.join(PRODUCTS_DIR, old_name)
    ext = os.path.splitext(old_name)[1]          # .jpg / .webp
    new_name = f"product_{pid}{ext}"
    new_path = os.path.join(PRODUCTS_DIR, new_name)

    # Rename file
    if os.path.exists(old_path):
        if os.path.exists(new_path):
            print(f"⚠️  Target already exists, removing old: {old_name}")
            os.remove(old_path)
        else:
            os.rename(old_path, new_path)
            print(f"✅ {old_name}  →  {new_name}")
        renamed += 1
    else:
        skipped.append(old_name)
        print(f"❌ File not found: {old_name}")

    # Update JSON entry
    if pid in products_by_id:
        products_by_id[pid]["image"] = f"Products/{new_name}"
        json_updated += 1

# Save updated JSON
with open(JSON_PATH, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"\n{'='*50}")
print(f"Files renamed : {renamed}")
print(f"JSON updated  : {json_updated}")
print(f"Skipped       : {len(skipped)}")
if skipped:
    print("Skipped files:")
    for s in skipped:
        print(f"  - {s}")

# Also clean up remaining extras (duplicates of already-mapped products)
extras = [
    "Эмзэг мэдрэмтгий хуйхтай, үс уналттай,.jpg",       # dup of 583881
    "Энгийн болон хуурай хуйхтай, үс уналттай,.jpg",      # dup of 583873
    "01 HARD SPRITZ - Amos Professional.jpg",               # dup of 580459
    "01 Softening conditioner Цацдаг ангижруулагч -.jpg",   # dup of 579443
    "04 Curling Fixer Долгион дэмжигч цацдаг хэв.jpg",     # dup of 580124
    "03 SILKY RADIANCE Будагтай үсний ойл 10мл -.jpg",     # dup of 580473
    "05 REPAIR CMC Химитэй, гэмтэлтэй үсний ойл 10мл.jpg", # dup of 578391
    "Тослог жижиг бужигнасан. хагтай, үс.jpg",            # no exact product match
    "02 THE GREEN TEA Үс уналтын эсрэг хуйхны серум .webp", # already handled above
]
extra_removed = 0
for e in extras:
    p = os.path.join(PRODUCTS_DIR, e)
    if os.path.exists(p):
        os.remove(p)
        print(f"🗑️  Removed extra: {e}")
        extra_removed += 1

print(f"Extras removed: {extra_removed}")

# Final check — count how many products still have SVG placeholders
svg_count = sum(1 for p in data["products"] if p["image"].startswith("data:"))
print(f"\nProducts still with SVG placeholder: {svg_count} / {len(data['products'])}")
