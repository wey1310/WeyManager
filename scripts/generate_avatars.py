import os
import subprocess

zodiac_signs = [
    {
        "name": "Aries", "vn": "Bạch Dương", "symbol": "♈",
        "color1": "#f43f5e", "color2": "#fda4af", "icon_color": "#be123c",
        "bg_female": "#fff1f2", "bg_male": "#ffe4e6"
    },
    {
        "name": "Taurus", "vn": "Kim Ngưu", "symbol": "♉",
        "color1": "#10b981", "color2": "#6ee7b7", "icon_color": "#047857",
        "bg_female": "#ecfdf5", "bg_male": "#d1fae5"
    },
    {
        "name": "Gemini", "vn": "Song Tử", "symbol": "♊",
        "color1": "#f59e0b", "color2": "#fde68a", "icon_color": "#b45309",
        "bg_female": "#fffbeb", "bg_male": "#fef3c7"
    },
    {
        "name": "Cancer", "vn": "Cự Giải", "symbol": "♋",
        "color1": "#06b6d4", "color2": "#a5f3fc", "icon_color": "#0e7490",
        "bg_female": "#ecfeff", "bg_male": "#cffafe"
    },
    {
        "name": "Leo", "vn": "Sư Tử", "symbol": "♌",
        "color1": "#f97316", "color2": "#fdba74", "icon_color": "#c2410c",
        "bg_female": "#fff7ed", "bg_male": "#ffedd5"
    },
    {
        "name": "Virgo", "vn": "Xử Nữ", "symbol": "♍",
        "color1": "#84cc16", "color2": "#bef264", "icon_color": "#4d7c0f",
        "bg_female": "#f7fee7", "bg_male": "#ecfccb"
    },
    {
        "name": "Libra", "vn": "Thiên Bình", "symbol": "♎",
        "color1": "#8b5cf6", "color2": "#c4b5fd", "icon_color": "#6d28d9",
        "bg_female": "#f5f3ff", "bg_male": "#ede9fe"
    },
    {
        "name": "Scorpio", "vn": "Bọ Cạp", "symbol": "♏",
        "color1": "#ec4899", "color2": "#fbcfe8", "icon_color": "#be185d",
        "bg_female": "#fdf2f8", "bg_male": "#fce7f3"
    },
    {
        "name": "Sagittarius", "vn": "Nhân Mã", "symbol": "♐",
        "color1": "#6366f1", "color2": "#a5b4fc", "icon_color": "#4338ca",
        "bg_female": "#eef2ff", "bg_male": "#e0e7ff"
    },
    {
        "name": "Capricorn", "vn": "Ma Kết", "symbol": "♑",
        "color1": "#059669", "color2": "#6ee7b7", "icon_color": "#065f46",
        "bg_female": "#f0fdf4", "bg_male": "#dcfce7"
    },
    {
        "name": "Aquarius", "vn": "Bảo Bình", "symbol": "♒",
        "color1": "#0284c7", "color2": "#7dd3fc", "icon_color": "#0369a1",
        "bg_female": "#f0f9ff", "bg_male": "#e0f2fe"
    },
    {
        "name": "Pisces", "vn": "Song Ngư", "symbol": "♓",
        "color1": "#14b8a6", "color2": "#99f6e4", "icon_color": "#0f766e",
        "bg_female": "#f0fdfa", "bg_male": "#ccfbf1"
    }
]

def make_svg(zodiac, gender):
    name = zodiac["name"]
    vn_name = zodiac["vn"]
    symbol = zodiac["symbol"]
    c1 = zodiac["color1"]
    c2 = zodiac["color2"]
    
    is_female = gender == "female"
    bg = zodiac["bg_female"] if is_female else zodiac["bg_male"]
    
    # Female features: cute ponytail/bob, hair flower/ribbon, warm cheeks
    # Male features: short neat hair, cool cap/spikes, bright eyes
    hair_color = "#3d271d" if is_female else "#241b16"
    skin_color = "#ffe0bd"
    blush = "#ff8da1"
    
    if is_female:
        hair_svg = f"""
        <!-- Female hair back -->
        <circle cx="128" cy="115" r="54" fill="{hair_color}" />
        <path d="M 82 120 Q 70 170 85 190 Q 95 160 92 130 Z" fill="{hair_color}" />
        <path d="M 174 120 Q 186 170 171 190 Q 161 160 164 130 Z" fill="{hair_color}" />
        <!-- Head -->
        <circle cx="128" cy="128" r="42" fill="{skin_color}" />
        <!-- Female Bangs -->
        <path d="M 88 116 Q 128 85 168 116 Q 150 102 128 106 Q 106 102 88 116 Z" fill="{hair_color}" />
        <circle cx="82" cy="100" r="14" fill="{c1}" />
        <circle cx="82" cy="100" r="7" fill="#fff" />
        """
    else:
        hair_svg = f"""
        <!-- Male hair -->
        <path d="M 80 120 Q 128 65 176 120 Q 170 95 128 88 Q 86 95 80 120 Z" fill="{hair_color}" />
        <circle cx="128" cy="130" r="42" fill="{skin_color}" />
        <path d="M 86 105 L 105 100 L 128 92 L 151 100 L 170 105 Q 128 90 86 105 Z" fill="{hair_color}" />
        """

    svg = f"""<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <linearGradient id="grad_{name}_{gender}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="{c1}" />
      <stop offset="100%" stop-color="{c2}" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="130%" height="130%">
      <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.18" />
    </filter>
  </defs>

  <!-- Outer circle backdrop -->
  <circle cx="128" cy="128" r="122" fill="{bg}" stroke="{c2}" stroke-width="4" />
  <circle cx="128" cy="128" r="114" fill="#ffffff" filter="url(#shadow)" opacity="0.9" />

  <!-- Soft gradient glow ring -->
  <circle cx="128" cy="128" r="106" fill="none" stroke="url(#grad_{name}_{gender})" stroke-width="6" opacity="0.8" />

  <!-- Character Hair & Face -->
  {hair_svg}

  <!-- Eyes -->
  <circle cx="112" cy="132" r="5" fill="#2d3748" />
  <circle cx="144" cy="132" r="5" fill="#2d3748" />
  <circle cx="114" cy="130" r="2" fill="#ffffff" />
  <circle cx="146" cy="130" r="2" fill="#ffffff" />

  <!-- Blush -->
  <ellipse cx="102" cy="142" rx="7" ry="4" fill="{blush}" opacity="0.65" />
  <ellipse cx="154" cy="142" rx="7" ry="4" fill="{blush}" opacity="0.65" />

  <!-- Smile -->
  <path d="M 120 146 Q 128 153 136 146" stroke="#c05621" stroke-width="2.5" fill="none" stroke-linecap="round" />

  <!-- Shirt / Clothes -->
  <path d="M 88 178 Q 128 168 168 178 L 180 230 Q 128 245 76 230 Z" fill="url(#grad_{name}_{gender})" />
  <path d="M 112 174 Q 128 185 144 174" fill="{skin_color}" />

  <!-- Zodiac symbol badge in bottom-right corner -->
  <g transform="translate(160, 160)" filter="url(#shadow)">
    <circle cx="34" cy="34" r="30" fill="#ffffff" stroke="{c1}" stroke-width="3" />
    <circle cx="34" cy="34" r="24" fill="url(#grad_{name}_{gender})" />
    <text x="34" y="42" font-family="'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="bold" fill="#ffffff" text-anchor="middle">{symbol}</text>
  </g>

  <!-- Constellation Name Label in top banner -->
  <g transform="translate(128, 28)">
    <rect x="-65" y="0" width="130" height="24" rx="12" fill="{c1}" opacity="0.9" />
    <text x="0" y="16" font-family="'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="bold" fill="#ffffff" text-anchor="middle">{name.upper()} • {('NỮ' if is_female else 'NAM')}</text>
  </g>
</svg>
"""
    return svg

dest_dirs = ["public/avatars", "public/assets/avatars", "src/assets/avatars", "public"]

for z in zodiac_signs:
    for g in ["female", "male"]:
        name = f"{z['name']}-{g}"
        svg_content = make_svg(z, g)
        svg_path = f"/tmp/{name}.svg"
        with open(svg_path, "w", encoding="utf-8") as f:
            f.write(svg_content)
        
        webp_tmp = f"/tmp/{name}.webp"
        # Convert SVG to WebP using ImageMagick convert
        cmd = ["convert", "-background", "none", "-density", "300", svg_path, "-resize", "256x256", webp_tmp]
        res = subprocess.run(cmd, capture_output=True)
        if res.returncode != 0:
            print(f"Error converting {name}: {res.stderr.decode()}")
        else:
            # Copy to destination directories
            for d in dest_dirs:
                os.makedirs(d, exist_ok=True)
                dest_webp = os.path.join(d, f"{name}.webp")
                subprocess.run(["cp", webp_tmp, dest_webp])
                # Also save SVG as fallback
                dest_svg = os.path.join(d, f"{name}.svg")
                subprocess.run(["cp", svg_path, dest_svg])
            print(f"Generated {name}.webp successfully")

print("All 24 Zodiac Avatars generated successfully!")
