# 1회용 dev 유틸 — 스캔 PDF의 특정 페이지를 PNG로 렌더링.
# poppler/pdftoppm 불필요(PyMuPDF 자체 렌더러 사용). 렌더된 PNG를 시각적으로 읽기 위함.
# 사용:
#   범위:  python scripts/render-pdf-pages.py <시작> <끝> [PDF] [DPI]
#   목록:  python scripts/render-pdf-pages.py 9,13,17 [PDF] [DPI]   ← 쉼표 포함시 목록 모드
import sys, os
import fitz  # PyMuPDF

arg1 = sys.argv[1] if len(sys.argv) > 1 else "1"

if "," in arg1:
    # 목록 모드: 비연속 페이지들
    pages = [int(x) for x in arg1.split(",") if x.strip()]
    src = sys.argv[2] if len(sys.argv) > 2 else "taro-scan.pdf"
    dpi = int(sys.argv[3]) if len(sys.argv) > 3 else 200
else:
    # 범위 모드
    start = int(arg1)
    end = int(sys.argv[2]) if len(sys.argv) > 2 else start
    src = sys.argv[3] if len(sys.argv) > 3 else "taro-scan.pdf"
    dpi = int(sys.argv[4]) if len(sys.argv) > 4 else 130
    pages = list(range(start, end + 1))

out_dir = os.path.join(".tmp", "pdf-pages")
os.makedirs(out_dir, exist_ok=True)

doc = fitz.open(src)
total = doc.page_count
pages = [n for n in pages if 1 <= n <= total]
print(f"{src}: 총 {total}페이지 · {len(pages)}장 렌더링 (DPI {dpi})")

for n in pages:
    page = doc.load_page(n - 1)
    pix = page.get_pixmap(dpi=dpi)
    path = os.path.join(out_dir, f"page-{n:03d}.png")
    pix.save(path)
    print(f"  page-{n:03d}.png ({pix.width}x{pix.height}, {os.path.getsize(path)//1024} KB)")

print(f"완료 → {out_dir}/")
