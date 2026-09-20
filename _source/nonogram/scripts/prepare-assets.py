from pathlib import Path
import subprocess
from PIL import Image
from fontTools import subset
from fontTools.varLib.instancer import instantiateVariableFont
ROOT=Path(__file__).resolve().parents[2]
OUT=ROOT/'website/public'
for src in sorted((ROOT/'design/generated').glob('bg_*_v2.png')):
 code=src.stem.split('_')[2]
 im=Image.open(src).convert('RGB').resize((1600,900),Image.Resampling.LANCZOS)
 im.save(OUT/f'images/city-{code}.avif',quality=48)
for name in ['prop_album_open','prop_passport_map','prop_tags_pair','prop_polaroids','prop_photos','hero_window_wing']:
 im=Image.open(ROOT/f'design/reference/assets/{name}.png').convert('RGB')
 im.thumbnail((1000,800))
 im.save(OUT/f'images/{name}.webp',quality=85)
subprocess.run(['node', str(ROOT/'website/scripts/prepare-icons.mjs')], check=True)
for name in ['newsreader','jakarta','jetbrains_mono']:
 options=subset.Options();options.flavor='woff2';options.desubroutinize=True
 font=subset.load_font(str(ROOT/f'composeApp/src/commonMain/composeResources/font/{name}.ttf'),options)
 if name=='newsreader': font=instantiateVariableFont(font,{'wght':500,'opsz':48},inplace=True)
 if name=='jetbrains_mono': font=instantiateVariableFont(font,{'wght':600},inplace=True)
 sub=subset.Subsetter(options=options);sub.populate(unicodes=list(range(0x20,0x100))+list(range(0x2000,0x2070))+[0x2190,0x2192,0x2193,0x2713,0x2715,0x2212])
 sub.subset(font);subset.save_font(font,str(OUT/f'fonts/{name}.woff2'),options)
texts=''.join(p.read_text() for p in (ROOT/'website/src').rglob('*') if p.suffix in ['.astro','.ts'])
options=subset.Options();options.flavor='woff2';options.desubroutinize=True
font=subset.load_font(str(ROOT/'composeApp/src/commonMain/composeResources/font/pretendard.ttf'),options)
sub=subset.Subsetter(options=options);sub.populate(text=texts+'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!? 행열비어있음칠함마크힌트완성칸')
sub.subset(font)
regular=instantiateVariableFont(font,{'wght':500},inplace=False)
bold=instantiateVariableFont(font,{'wght':700},inplace=False)
subset.save_font(regular,str(OUT/'fonts/pretendard.woff2'),options)
subset.save_font(bold,str(OUT/'fonts/pretendard-bold.woff2'),options)
print('Prepared web images and subset fonts')
