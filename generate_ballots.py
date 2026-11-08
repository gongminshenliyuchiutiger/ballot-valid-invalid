# -*- coding: utf-8 -*-
"""
公職人員選舉票有效與無效之認定遊戲系統
53 張全圖例程式向量生成引擎
候選人：1號 李虞、2號 秋姥琥
"""

import math
import os
from PIL import Image, ImageDraw, ImageFont

# 字型設定
FONT_PATH = "C:/Windows/Fonts/msjhbd.ttc"
FONT_REGULAR = "C:/Windows/Fonts/msjh.ttc"

def get_font(size, bold=True):
    path = FONT_PATH if bold else FONT_REGULAR
    try:
        return ImageFont.truetype(path, size)
    except:
        return ImageFont.load_default()

# 顏色定義
PAPER_BG = (252, 251, 247)
BORDER_DARK = (45, 55, 72)
BORDER_GRAY = (180, 185, 195)
TEXT_BLACK = (20, 25, 35)
STAMP_RED = (238, 29, 35)
STAMP_FAINT = (245, 160, 165)
INK_BLUE = (30, 58, 138)
SEAL_RED = (200, 30, 30)

def draw_official_stamp(draw, cx, cy, r=32, stroke_w=5, is_folded=False, is_broken=False, color=None):
    """
    繪製中央選舉委員會專用圈選印章
    外圓 + 貫穿垂直中線 + 中心往左下45度斜線 (若 is_folded=True 則斜線向右下鏡射且顏色較淡)
    """
    c = color if color else (STAMP_FAINT if is_folded else STAMP_RED)
    sw = stroke_w

    if is_broken:
        # 部分印出 / 斷印 (Valid 23, 24, 25)
        # 繪製約 240 度的弧線與部分中線
        draw.arc([cx - r, cy - r, cx + r, cy + r], start=45, end=270, fill=c, width=sw)
        draw.line([cx, cy - r + 8, cx, cy + r * 0.4], fill=c, width=sw)
        # 部分斜線
        dx = int(r * 0.5 * math.cos(math.radians(45)))
        dy = int(r * 0.5 * math.sin(math.radians(45)))
        draw.line([cx, cy, cx - dx, cy + dy], fill=c, width=sw)
        return

    # 完整外圓
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=c, width=sw)
    # 貫穿垂直中線 (從頂到碰到底部圓周)
    draw.line([cx, cy - r, cx, cy + r], fill=c, width=sw)

    # 斜線
    diag_r = r - sw // 2
    if not is_folded:
        # 正常真印：中心向左下 45 度
        end_x = int(cx - diag_r * math.cos(math.radians(45)))
        end_y = int(cy + diag_r * math.sin(math.radians(45)))
        draw.line([cx, cy, end_x, end_y], fill=c, width=sw)
    else:
        # 疊折反印：水平鏡射向右下 45 度
        end_x = int(cx + diag_r * math.cos(math.radians(45)))
        end_y = int(cy + diag_r * math.sin(math.radians(45)))
        draw.line([cx, cy, end_x, end_y], fill=c, width=sw)

def draw_private_seal(draw, cx, cy, text="陳印", size=36):
    """繪製私章方印"""
    half = size // 2
    draw.rectangle([cx - half, cy - half, cx + half, cy + half], outline=SEAL_RED, width=3, fill=(255, 235, 235))
    font = get_font(14, bold=True)
    # 兩字垂直排
    draw.text((cx, cy - 8), text[0], fill=SEAL_RED, font=font, anchor="mm")
    draw.text((cx, cy + 8), text[1] if len(text) > 1 else "印", fill=SEAL_RED, font=font, anchor="mm")

def draw_fingerprint(draw, cx, cy, rx=18, ry=26):
    """繪製指印捺印紋路"""
    # 繪製多重橢圓模擬指紋
    c = (210, 40, 40)
    for i in range(5, 0, -1):
        cur_rx = int(rx * (i / 5.0))
        cur_ry = int(ry * (i / 5.0))
        draw.ellipse([cx - cur_rx, cy - cur_ry, cx + cur_rx, cy + cur_ry], outline=c, width=2)
    # 中心實心微暈
    draw.ellipse([cx - 4, cy - 6, cx + 4, cy + 6], fill=(190, 25, 25))

def create_base_ballot(w=380, h=640, num_cols=2, has_seal=True, is_non_official=False):
    """
    建立標準公職人員選舉票底圖
    候選人：1號 李虞、2號 秋姥琥
    """
    img = Image.new("RGB", (w, h), PAPER_BG)
    draw = ImageDraw.Draw(img)

    if is_non_official:
        # 非官方私製便條紙 (Invalid 1)
        draw.rectangle([10, 10, w - 10, h - 10], fill=(255, 255, 255), outline=(150, 150, 150), width=2)
        font_h = get_font(20, bold=True)
        draw.text((w // 2, 80), "【自備白紙投票】", fill=(220, 30, 30), font=font_h, anchor="mm")
        font_t = get_font(18, bold=True)
        draw.text((w // 2, 220), "1 號 李 虞", fill=(40, 40, 40), font=font_t, anchor="mm")
        draw.text((w // 2, 280), "2 號 秋 姥 琥", fill=(40, 40, 40), font=font_t, anchor="mm")
        draw.rectangle([30, 440, w - 30, 520], fill=(254, 226, 226), outline=(220, 38, 38), width=2)
        draw.text((w // 2, 480), "非選委會製發選票 (無效票)", fill=(185, 28, 28), font=font_t, anchor="mm")
        return img, draw, {}

    # 外邊框
    pad = 12
    draw.rectangle([pad, pad, w - pad, h - pad], outline=BORDER_DARK, width=2)

    # 抬頭區 (高 65)
    header_h = 65
    draw.line([pad, pad + header_h, w - pad, pad + header_h], fill=BORDER_DARK, width=2)

    font_title = get_font(16, bold=True)
    draw.text((w // 2 - 30, pad + 20), "公職人員選舉票", fill=TEXT_BLACK, font=font_title, anchor="mm")
    font_sub = get_font(10, bold=False)
    draw.text((w // 2 - 30, pad + 45), "請使用選委會製備之工具圈選", fill=(80, 85, 95), font=font_sub, anchor="mm")

    # 右上方主管選舉委員會印信關防 (38x38)
    if has_seal:
        seal_x = w - pad - 50
        seal_y = pad + 12
        draw.rectangle([seal_x, seal_y, seal_x + 40, seal_y + 40], outline=SEAL_RED, width=2, fill=(255, 240, 240))
        font_seal = get_font(8, bold=True)
        draw.text((seal_x + 20, seal_y + 12), "選舉委員會", fill=SEAL_RED, font=font_seal, anchor="mm")
        draw.text((seal_x + 20, seal_y + 28), "印信", fill=SEAL_RED, font=font_seal, anchor="mm")
    else:
        # 漏印關防 (Invalid 25)
        seal_x = w - pad - 50
        seal_y = pad + 12
        draw.rectangle([seal_x, seal_y, seal_x + 40, seal_y + 40], outline=(220, 38, 38), width=1)
        font_seal = get_font(8, bold=False)
        draw.text((seal_x + 20, seal_y + 20), "關防欄", fill=(180, 80, 80), font=font_seal, anchor="mm")

    # 候選人欄位區
    body_top = pad + header_h
    body_bottom = h - pad
    body_h = body_bottom - body_top
    col_w = (w - pad * 2) // num_cols

    layout = {}
    names = ["李 虞", "秋 姥 琥", "龔 民 申"]

    # 各分段高度
    stamp_zone_h = 105   # 頂部圈選欄
    no_zone_h = 55       # 號次欄
    photo_zone_h = 135   # 相片欄
    name_zone_h = body_h - stamp_zone_h - no_zone_h - photo_zone_h  # 姓名欄

    for col in range(num_cols):
        cx1 = pad + col * col_w
        cx2 = cx1 + col_w
        if col < num_cols - 1:
            draw.line([cx2, body_top, cx2, body_bottom], fill=BORDER_DARK, width=2)

        # 圈選格 (1)
        y1 = body_top
        y2 = y1 + stamp_zone_h
        draw.line([cx1, y2, cx2, y2], fill=BORDER_DARK, width=2)
        font_hint = get_font(10, bold=False)
        draw.text(((cx1 + cx2) // 2, y1 + 16), "圈選欄", fill=(160, 165, 175), font=font_hint, anchor="mm")

        # 號次格 (2)
        y3 = y2 + no_zone_h
        draw.line([cx1, y3, cx2, y3], fill=BORDER_GRAY, width=1)
        font_no = get_font(28, bold=True)
        draw.text(((cx1 + cx2) // 2, (y2 + y3) // 2), str(col + 1), fill=TEXT_BLACK, font=font_no, anchor="mm")

        # 相片格 (3)
        y4 = y3 + photo_zone_h
        draw.line([cx1, y4, cx2, y4], fill=BORDER_GRAY, width=1)
        # 繪製相片頭像背景框與剪影
        draw.rectangle([cx1 + 12, y3 + 10, cx2 - 12, y4 - 10], fill=(240, 242, 245), outline=BORDER_GRAY, width=1)
        # 候選人頭像幾何簡約繪製
        px = (cx1 + cx2) // 2
        py = (y3 + y4) // 2
        draw.ellipse([px - 18, py - 24, px + 18, py + 12], fill=(160, 170, 185))  # 頭
        draw.chord([px - 28, py + 8, px + 28, py + 48], start=180, end=0, fill=(160, 170, 185)) # 肩膀

        # 姓名欄 (4)
        cname = names[col] if col < len(names) else f"候選人{col+1}"
        chars = cname.replace(" ", "")
        font_name = get_font(20, bold=True)
        # 直式垂直文字排版
        ny_start = y4 + 25
        gap = (name_zone_h - 50) // max(len(chars), 1)
        for idx, ch in enumerate(chars):
            draw.text(((cx1 + cx2) // 2, ny_start + idx * gap), ch, fill=TEXT_BLACK, font=font_name, anchor="mm")

        layout[col + 1] = {
            "stamp_center": ((cx1 + cx2) // 2, y1 + stamp_zone_h // 2 + 10),
            "no_center": ((cx1 + cx2) // 2, (y2 + y3) // 2),
            "photo_center": ((cx1 + cx2) // 2, (y3 + y4) // 2),
            "name_center": ((cx1 + cx2) // 2, (y4 + body_bottom) // 2),
            "cx1": cx1,
            "cx2": cx2,
            "mid_y": (y1 + body_bottom) // 2,
            "body_top": body_top,
            "body_bottom": body_bottom
        }

    layout["divider_x"] = pad + col_w
    return img, draw, layout

def generate_all():
    os.makedirs("image/ballots", exist_ok=True)
    print("開始以純程式繪製 53 張選票圖例...")

    # ========================================================
    # 【有效票 1~28 例】
    # ========================================================

    # 有效 1: 圈於 1 號 (李虞) 號次上空白格內
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    img.save("image/ballots/valid_1.png")

    # 有效 2: 圈於 1 號號次格內
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["no_center"][0], lay[1]["no_center"][1])
    img.save("image/ballots/valid_2.png")

    # 有效 3: 圈於 1 號相片格內
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["photo_center"][0], lay[1]["photo_center"][1])
    img.save("image/ballots/valid_3.png")

    # 有效 4: 圈於 1 號姓名格內 (李虞)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["name_center"][0], lay[1]["name_center"][1])
    img.save("image/ballots/valid_4.png")

    # 有效 5: 圈於 1 號欄內空白處 (姓名下方)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["name_center"][0], lay[1]["body_bottom"] - 45)
    img.save("image/ballots/valid_5.png")

    # 有效 6: 圈於 1 號相片與號次間格線內
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0] - 15, lay[1]["photo_center"][1] - 40)
    img.save("image/ballots/valid_6.png")

    # 有效 7: 圈於 1 號姓名欄右側空間
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0] + 25, lay[1]["name_center"][1] - 30)
    img.save("image/ballots/valid_7.png")

    # 有效 8: 部分圈選於 1 號外側內線與邊緣之間 (微出左外緣)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["cx1"] + 5, lay[1]["stamp_center"][1])
    img.save("image/ballots/valid_8.png")

    # 有效 9: 圈印出界至 1 號相片外側邊緣
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["cx1"] + 2, lay[1]["photo_center"][1])
    img.save("image/ballots/valid_9.png")

    # 有效 10: 圈印出界至頂部邊緣 (仍在 1 號欄)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["body_top"] + 5)
    img.save("image/ballots/valid_10.png")

    # 有效 11: 圈印微出 1 號底部邊緣
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["body_bottom"] - 5)
    img.save("image/ballots/valid_11.png")

    # 有效 12: 圈於 1 號與 2 號相鄰共用隔線，但大部在 1 號 (李虞) 欄內
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay["divider_x"] - 22, lay[1]["stamp_center"][1])
    img.save("image/ballots/valid_12.png")

    # 有效 13: 圈於相鄰號次共用隔線，主體在 1 號號次
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay["divider_x"] - 20, lay[1]["no_center"][1])
    img.save("image/ballots/valid_13.png")

    # 有效 14: 圈於相鄰相片隔線，偏向 1 號
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay["divider_x"] - 24, lay[1]["photo_center"][1])
    img.save("image/ballots/valid_14.png")

    # 有效 15: 圈於相鄰姓名隔線，偏向 1 號 (李虞)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay["divider_x"] - 20, lay[1]["name_center"][1])
    img.save("image/ballots/valid_15.png")

    # 有效 16: 圈選於相鄰共用空間，部分圈印加蓋於 1 號格線上，能辨別為 1 號
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay["divider_x"] - 18, lay[1]["stamp_center"][1] + 30)
    img.save("image/ballots/valid_16.png")

    # 有效 17: 圈選於 1 號欄格與邊緣之間，部分加蓋於格線上，能辨別為 1 號
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["cx1"] + 15, lay[1]["body_top"] + 40)
    img.save("image/ballots/valid_17.png")

    # 有效 18: 圈選 1 號而圈二圈以上 (在圈選欄圈兩圈)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0] - 18, lay[1]["stamp_center"][1] - 8)
    draw_official_stamp(draw, lay[1]["stamp_center"][0] + 18, lay[1]["stamp_center"][1] + 8)
    img.save("image/ballots/valid_18.png")

    # 有效 19: 在 1 號號次與姓名欄各圈一圈 (同一候選人)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["no_center"][0], lay[1]["no_center"][1])
    draw_official_stamp(draw, lay[1]["name_center"][0], lay[1]["name_center"][1] - 20)
    img.save("image/ballots/valid_19.png")

    # 有效 20: 在 1 號圈選欄縱向圈兩圈
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1] - 20)
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1] + 20)
    img.save("image/ballots/valid_20.png")

    # 有效 21: 在 1 號欄內圈三圈 (圈選格、相片格、姓名格)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    draw_official_stamp(draw, lay[1]["photo_center"][0], lay[1]["photo_center"][1])
    draw_official_stamp(draw, lay[1]["name_center"][0], lay[1]["name_center"][1])
    img.save("image/ballots/valid_21.png")

    # 有效 22: 疊折反印！1 號為真印 (左下斜線，濃色)，2 號為折疊鏡射拓印 (右下斜線，淡色)
    img, draw, lay = create_base_ballot()
    # 1 號真印
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1], is_folded=False)
    # 2 號折疊鏡射淡印 (斜線朝右下)
    draw_official_stamp(draw, lay[2]["stamp_center"][0], lay[2]["stamp_center"][1], is_folded=True)
    # 繪製中央淡淡摺痕虛線
    draw.line([lay["divider_x"], lay[1]["body_top"], lay["divider_x"], lay[1]["body_bottom"]], fill=(200, 205, 215), width=1)
    img.save("image/ballots/valid_22.png")

    # 有效 23: 圈選工具部分印出 (印泥較乾，斷印)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1], is_broken=True)
    img.save("image/ballots/valid_23.png")

    # 有效 24: 力道不均，僅印出半弧與中心微痕
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["no_center"][0], lay[1]["no_center"][1], is_broken=True)
    img.save("image/ballots/valid_24.png")

    # 有效 25: 圈選章部分印出 (相片格)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["photo_center"][0], lay[1]["photo_center"][1], is_broken=True)
    img.save("image/ballots/valid_25.png")

    # 有效 26: 在原圈位置重複圈蓋形成微位移二圈
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    draw_official_stamp(draw, lay[1]["stamp_center"][0] + 6, lay[1]["stamp_center"][1] + 5)
    img.save("image/ballots/valid_26.png")

    # 有效 27: 在 1 號相片格重複圈蓋微移二圈
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["photo_center"][0], lay[1]["photo_center"][1])
    draw_official_stamp(draw, lay[1]["photo_center"][0] - 5, lay[1]["photo_center"][1] + 6)
    img.save("image/ballots/valid_27.png")

    # 有效 28: 沾染印泥痕跡 (非指印亦非符號，1號有正常圈選)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    # 蹭到的印泥污漬
    draw.ellipse([lay[2]["stamp_center"][0] - 10, lay[2]["stamp_center"][1] - 8, lay[2]["stamp_center"][0] + 14, lay[2]["stamp_center"][1] + 12], fill=(230, 100, 100))
    draw.ellipse([lay[1]["cx1"] + 30, lay[1]["body_bottom"] - 60, lay[1]["cx1"] + 45, lay[1]["body_bottom"] - 50], fill=(230, 120, 120))
    img.save("image/ballots/valid_28.png")

    # ========================================================
    # 【無效票 1~25 例】
    # ========================================================

    # 無效 1: 不用選委會製發之選舉票 (非官方白紙)
    img, draw, lay = create_base_ballot(is_non_official=True)
    draw_official_stamp(draw, 190, 360)
    img.save("image/ballots/invalid_1.png")

    # 無效 2: 不加圈完全空白
    img, draw, lay = create_base_ballot()
    # 空白不圈任何印章
    img.save("image/ballots/invalid_2.png")

    # 無效 3: 同時圈選二人 (1 號李虞與 2 號秋姥琥皆在圈選欄蓋印)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    draw_official_stamp(draw, lay[2]["stamp_center"][0], lay[2]["stamp_center"][1])
    img.save("image/ballots/invalid_3.png")

    # 無效 4: 分別在 1 號號次與 2 號號次蓋印
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["no_center"][0], lay[1]["no_center"][1])
    draw_official_stamp(draw, lay[2]["no_center"][0], lay[2]["no_center"][1])
    img.save("image/ballots/invalid_4.png")

    # 無效 5: 同時圈選三人以上 (3 欄選票：李虞、秋姥琥、龔民申全部蓋印)
    img3, draw3, lay3 = create_base_ballot(w=460, num_cols=3)
    draw_official_stamp(draw3, lay3[1]["stamp_center"][0], lay3[1]["stamp_center"][1])
    draw_official_stamp(draw3, lay3[2]["stamp_center"][0], lay3[2]["stamp_center"][1])
    draw_official_stamp(draw3, lay3[3]["stamp_center"][0], lay3[3]["stamp_center"][1])
    img3.save("image/ballots/invalid_5.png")

    # 無效 6: 圈選於 1 號與 2 號相鄰共用隔線正中央，無法辨別
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay["divider_x"], lay[1]["stamp_center"][1])
    img.save("image/ballots/invalid_6.png")

    # 無效 7: 圈選後加以塗改另行圈選 (1 號塗改劃叉，另圈 2 號)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    # 黑色原子筆劃叉塗改 1 號
    draw.line([lay[1]["stamp_center"][0] - 30, lay[1]["stamp_center"][1] - 30, lay[1]["stamp_center"][0] + 30, lay[1]["stamp_center"][1] + 30], fill=(20, 20, 20), width=4)
    draw.line([lay[1]["stamp_center"][0] + 30, lay[1]["stamp_center"][1] - 30, lay[1]["stamp_center"][0] - 30, lay[1]["stamp_center"][1] + 30], fill=(20, 20, 20), width=4)
    # 另圈 2 號
    draw_official_stamp(draw, lay[2]["stamp_center"][0], lay[2]["stamp_center"][1])
    img.save("image/ballots/invalid_7.png")

    # 無效 8: 圈選後加以塗改 (1 號圈印後畫黑線塗改)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    # 粗線塗抹塗銷
    for offset in range(-15, 20, 5):
        draw.line([lay[1]["stamp_center"][0] - 32, lay[1]["stamp_center"][1] + offset, lay[1]["stamp_center"][0] + 32, lay[1]["stamp_center"][1] + offset], fill=(20, 20, 20), width=3)
    img.save("image/ballots/invalid_8.png")

    # 無效 9: 簽名者 (未圈印直接在 1 號姓名處簽名)
    img, draw, lay = create_base_ballot()
    font_sign = get_font(22, bold=False)
    draw.text((lay[1]["stamp_center"][0], lay[1]["stamp_center"][1]), "王小明", fill=INK_BLUE, font=font_sign, anchor="mm")
    img.save("image/ballots/invalid_9.png")

    # 無效 10: 圈選後加以簽名者 (圈 1 號後在旁邊簽名)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    font_sign = get_font(18, bold=False)
    draw.text((lay[1]["stamp_center"][0], lay[1]["no_center"][1] - 15), "張大明簽", fill=INK_BLUE, font=font_sign, anchor="mm")
    img.save("image/ballots/invalid_10.png")

    # 無效 11: 蓋章者 (蓋私章)
    img, draw, lay = create_base_ballot()
    draw_private_seal(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1], "陳印")
    img.save("image/ballots/invalid_11.png")

    # 無效 12: 圈選後加以蓋章者 (圈選 1 號後又蓋私章)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    draw_private_seal(draw, lay[1]["name_center"][0], lay[1]["name_center"][1] + 25, "李印")
    img.save("image/ballots/invalid_12.png")

    # 無效 13: 按指印者 (圈選欄按指印)
    img, draw, lay = create_base_ballot()
    draw_fingerprint(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    img.save("image/ballots/invalid_13.png")

    # 無效 14: 於空白處按指印
    img, draw, lay = create_base_ballot()
    draw_fingerprint(draw, lay[1]["name_center"][0], lay[1]["body_bottom"] - 50)
    img.save("image/ballots/invalid_14.png")

    # 無效 15: 於號次處按指印代替圈選
    img, draw, lay = create_base_ballot()
    draw_fingerprint(draw, lay[1]["no_center"][0], lay[1]["no_center"][1])
    img.save("image/ballots/invalid_15.png")

    # 無效 16: 圈選後加以按指印 (圈 1 號後在相片旁按指印)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    draw_fingerprint(draw, lay[1]["photo_center"][0] + 30, lay[1]["photo_center"][1])
    img.save("image/ballots/invalid_16.png")

    # 無效 17: 圈選後在選票邊緣按指印
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    draw_fingerprint(draw, lay[1]["cx1"] + 15, lay[1]["name_center"][1])
    img.save("image/ballots/invalid_17.png")

    # 無效 18: 圈選後在相片欄格按指印
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    draw_fingerprint(draw, lay[1]["photo_center"][0], lay[1]["photo_center"][1])
    img.save("image/ballots/invalid_18.png")

    # 無效 19: 圈選後記載任何文字 (書寫「當選」、「好」)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    font_w = get_font(20, bold=True)
    draw.text((lay[1]["name_center"][0], lay[1]["name_center"][1] + 30), "當選！", fill=INK_BLUE, font=font_w, anchor="mm")
    img.save("image/ballots/invalid_19.png")

    # 無效 20: 劃寫符號者 (畫打勾✓ 或 打叉✗)
    img, draw, lay = create_base_ballot()
    # 畫打勾
    draw.line([lay[1]["stamp_center"][0] - 25, lay[1]["stamp_center"][1], lay[1]["stamp_center"][0] - 5, lay[1]["stamp_center"][1] + 25], fill=(220, 30, 30), width=6)
    draw.line([lay[1]["stamp_center"][0] - 5, lay[1]["stamp_center"][1] + 25, lay[1]["stamp_center"][0] + 30, lay[1]["stamp_center"][1] - 25], fill=(220, 30, 30), width=6)
    img.save("image/ballots/invalid_20.png")

    # 無效 21: 圈選後加以劃寫符號 (圈選 1 號後畫笑臉)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    # 畫笑臉符號
    fc_x = lay[1]["name_center"][0]
    fc_y = lay[1]["name_center"][1] + 25
    draw.ellipse([fc_x - 18, fc_y - 18, fc_x + 18, fc_y + 18], outline=INK_BLUE, width=3)
    draw.ellipse([fc_x - 8, fc_y - 6, fc_x - 4, fc_y - 2], fill=INK_BLUE)
    draw.ellipse([fc_x + 4, fc_y - 6, fc_x + 8, fc_y - 2], fill=INK_BLUE)
    draw.arc([fc_x - 10, fc_y - 5, fc_x + 10, fc_y + 12], start=0, end=180, fill=INK_BLUE, width=3)
    img.save("image/ballots/invalid_21.png")

    # 無效 22: 將選舉票任何一角撕破致不完整 (右上角撕破)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    # 將右上角塗為深黑背景模擬撕除破角
    draw.polygon([(300, 0), (380, 0), (380, 80)], fill=(15, 23, 42))
    draw.line([(300, 0), (380, 80)], fill=(239, 68, 68), width=2)
    img.save("image/ballots/invalid_22.png")

    # 無效 23: 將選舉票污染致不能辨別所圈為何人 (大面積墨水污染)
    img, draw, lay = create_base_ballot()
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    # 潑灑大片黑墨
    draw.ellipse([80, 80, 280, 240], fill=(40, 40, 45))
    draw.ellipse([140, 60, 220, 160], fill=(40, 40, 45))
    draw.ellipse([180, 150, 310, 280], fill=(40, 40, 45))
    img.save("image/ballots/invalid_23.png")

    # 無效 24: 不用選委會製備之圈選工具 (原子筆手繪圓圈)
    img, draw, lay = create_base_ballot()
    # 徒手手繪圓圈 (不規則藍色圓圈)
    pts = [(lay[1]["stamp_center"][0] + int(28 * math.cos(math.radians(a))),
            lay[1]["stamp_center"][1] + int(28 * math.sin(math.radians(a))) + (a % 5)) for a in range(0, 360, 15)]
    draw.line(pts + [pts[0]], fill=INK_BLUE, width=4)
    img.save("image/ballots/invalid_24.png")

    # 無效 25: 漏印關防之選舉票 (右上角未蓋選委會印信)
    img, draw, lay = create_base_ballot(has_seal=False)
    draw_official_stamp(draw, lay[1]["stamp_center"][0], lay[1]["stamp_center"][1])
    img.save("image/ballots/invalid_25.png")

    print("53 張選票圖例全部生成完成！品質極致清晰！")

if __name__ == "__main__":
    generate_all()
