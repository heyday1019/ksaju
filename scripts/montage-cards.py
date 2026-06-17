# 1회용 dev 유틸 — 마이너 아르카나 카드의 두 페이지(테마/키워드)를 한 장으로 합쳐 1회 읽기.
# 이미지 페이지 하단(테마 한 줄) + 키워드 페이지 상단(정방향/역방향 박스)을 세로로 스택.
# 사용: python scripts/montage-cards.py 102:103,104:105 [PDF] [DPI]
import sys, os
import fitz  # PyMuPDF
from PIL import Image

pairs_arg = sys.argv[1]
src = sys.argv[2] if len(sys.argv) > 2 else "taro-scan.pdf"
dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 200

# 자를 세로 구간(페이지 높이 대비 비율)
IMG_TOP, IMG_BOT = 0.58, 1.00   # 이미지 페이지: 하단(테마 박스)
KW_TOP, KW_BOT = 0.04, 0.44     # 키워드 페이지: 상단(카드명 + 정방향 박스)

out_dir = os.path.join(".tmp", "pdf-pages")
os.makedirs(out_dir, exist_ok=True)
doc = fitz.open(src)


def render(n):
    pix = doc.load_page(n - 1).get_pixmap(dpi=dpi)
    return Image.frombytes("RGB", (pix.width, pix.height), pix.samples)


def crop_frac(im, top, bot):
    w, h = im.size
    return im.crop((0, int(h * top), w, int(h * bot)))


pairs = []
for tok in pairs_arg.split(","):
    tok = tok.strip()
    if not tok:
        continue
    img_p, kw_p = (int(x) for x in tok.split(":"))
    pairs.append((img_p, kw_p))

print(f"{src}: {len(pairs)}장 몽타주 (DPI {dpi})")
for img_p, kw_p in pairs:
    a = crop_frac(render(img_p), IMG_TOP, IMG_BOT)
    b = crop_frac(render(kw_p), KW_TOP, KW_BOT)
    w = max(a.width, b.width)
    canvas = Image.new("RGB", (w, a.height + b.height), "white")
    canvas.paste(a, (0, 0))
    canvas.paste(b, (0, a.height))
    path = os.path.join(out_dir, f"card-{kw_p:03d}.png")
    canvas.save(path)
    print(f"  card-{kw_p:03d}.png  (p{img_p}+p{kw_p}, {canvas.width}x{canvas.height}, {os.path.getsize(path)//1024} KB)")

print(f"완료 → {out_dir}/")
