#!/usr/bin/env python3
"""Draws the title and explainer cards for the demo video (1600x900 PNGs)."""
import os
from PIL import Image, ImageDraw, ImageFont

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "build", "video")
W, H = 1600, 900

# Same palette as the terminal (Catppuccin Mocha).
BG = (30, 30, 46)
TEXT = (205, 214, 244)
DIM = (147, 153, 178)
ROSE = (243, 139, 168)
TEAL = (148, 226, 213)
GREEN = (166, 227, 161)

AVENIR = "/System/Library/Fonts/Avenir Next.ttc"


def avenir(style, size):
    for i in range(12):
        try:
            f = ImageFont.truetype(AVENIR, size, index=i)
        except OSError:
            break
        if f.getname()[1].lower() == style.lower():
            return f
    return ImageFont.truetype(AVENIR, size)


BOLD = lambda s: avenir("Bold", s)
DEMI = lambda s: avenir("Demi Bold", s)
REG = lambda s: avenir("Regular", s)
MONO = lambda s: ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", s)


def card(name, lines, top=None):
    """lines: list of (text, font, color, gap_after)."""
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    heights = [d.textbbox((0, 0), t, font=f)[3] for t, f, _, _ in lines]
    total = sum(heights) + sum(g for *_, g in lines)
    y = top if top is not None else (H - total) // 2
    for (t, f, c, gap), h in zip(lines, heights):
        w = d.textlength(t, font=f)
        d.text(((W - w) / 2, y), t, font=f, fill=c)
        y += h + gap
    # thin accent line at the bottom
    d.rectangle([0, H - 8, W, H], fill=ROSE)
    img.save(os.path.join(OUT, name))


def table_card(name, title, rows, foot):
    img = Image.new("RGB", (W, H), BG)
    d = ImageDraw.Draw(img)
    f_title, f_head, f_row, f_foot = BOLD(58), DEMI(30), REG(36), REG(30)
    y = 110
    w = d.textlength(title, font=f_title)
    d.text(((W - w) / 2, y), title, font=f_title, fill=TEXT)
    y += 120
    cols = [260, 820, 1120]
    for x, h in zip(cols, ["Fault", "Caught", "Average stop"]):
        d.text((x, y), h, font=f_head, fill=DIM)
    y += 60
    for fault, caught, avg in rows:
        d.text((cols[0], y), fault, font=f_row, fill=TEXT)
        d.text((cols[1], y), caught, font=f_row, fill=GREEN)
        d.text((cols[2], y), avg, font=f_row, fill=TEAL)
        y += 64
    y += 30
    w = d.textlength(foot, font=f_foot)
    d.text(((W - w) / 2, y), foot, font=f_foot, fill=DIM)
    d.rectangle([0, H - 8, W, H], fill=ROSE)
    img.save(os.path.join(OUT, name))


os.makedirs(OUT, exist_ok=True)

card("01_title.png", [
    ("InfuSafe", BOLD(130), TEXT, 30),
    ("A safety monitor for chemo infusion pumps", REG(44), DIM, 60),
    ("Built on QNX 8.0", DEMI(40), ROSE, 0),
])

card("02_problem.png", [
    ("Chemo goes in through an infusion pump.", DEMI(52), TEXT, 50),
    ("A line gets kinked.", REG(44), DIM, 18),
    ("Air gets into the tube.", REG(44), DIM, 18),
    ("Someone types 500 instead of 50.", REG(44), DIM, 60),
    ("InfuSafe checks the pump 1,000 times a second", DEMI(46), TEAL, 14),
    ("and stops it when something goes wrong.", DEMI(46), TEAL, 0),
])

card("03_live.png", [
    ("This is a real QNX 8.0 session.", DEMI(56), TEXT, 30),
    ("Booted from an image built with mkifs, running in QEMU.", REG(40), DIM, 0),
])

card("04_how.png", [
    ("How it works", BOLD(66), TEXT, 60),
    ("A QNX timer pulse wakes the monitor every 1 ms.", REG(42), TEXT, 22),
    ("It runs at priority 50. The sensor runs at 40.", REG(42), TEXT, 22),
    ("It never prints and never waits on a lock.", REG(42), TEXT, 22),
    ("/dev/infusafe is a QNX resource manager.", REG(42), TEXT, 0),
])

table_card("05_results.png", "100 out of 100 faults caught", [
    ("Blocked line", "20 of 20", "9.7 ms"),
    ("Air bubble", "20 of 20", "3.1 ms"),
    ("Sensor goes silent", "20 of 20", "4.4 ms"),
    ("Free flow", "20 of 20", "51.8 ms"),
    ("Empty bag (alarm)", "20 of 20", "under 0.01 ms"),
], "Measured on QNX 8.0 in QEMU. Free flow waits 50 ms on purpose.")

card("06_bugs.png", [
    ("3 real bugs QNX helped me find", BOLD(60), TEXT, 60),
    ("1.  The monitor printed to the console, and that could block it.", REG(38), TEXT, 26),
    ("2.  On one CPU, monitor and sensor could freeze each other.", REG(38), TEXT, 26),
    ("3.  A bubble could slip past if the monitor ran late.", REG(38), TEXT, 50),
    ("All three are fixed and tested.", DEMI(42), GREEN, 0),
])

card("07_end.png", [
    ("InfuSafe", BOLD(110), TEXT, 40),
    ("github.com/KushagraRishi/infusafe-qnx", MONO(40), TEAL, 40),
    ("Built on QNX 8.0", DEMI(40), ROSE, 0),
])

print("cards written to", OUT)
