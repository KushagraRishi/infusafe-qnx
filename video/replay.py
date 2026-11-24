#!/usr/bin/env python3
"""
Plays back build/video/session.json (real QNX output saved by
capture.py) at a pace people can read, for the demo video.
Commands are typed out, output is printed exactly as QNX printed it,
and short captions explain each step. Only waiting time is cut.
"""
import json
import os
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
S = json.load(open(os.path.join(ROOT, "build", "video", "session.json")))

ROSE = "\033[38;2;243;139;168m"
TEAL = "\033[38;2;148;226;213m"
DIM = "\033[38;2;147;153;178m"
BOLD = "\033[1m"
RESET = "\033[0m"


def out(s=""):
    sys.stdout.write(s)
    sys.stdout.flush()


def clear():
    out("\033[2J\033[H")


def caption(text, hold=1.6):
    out(f"{ROSE}{BOLD}» {text}{RESET}\n")
    time.sleep(hold)


def type_cmd(cmd):
    out("# ")
    time.sleep(0.5)
    for ch in cmd:
        out(ch)
        time.sleep(0.045)
    time.sleep(0.35)
    out("\n")


def show(text, line_delay=0.03, highlight=()):
    for line in text.split("\n"):
        if any(h in line for h in highlight):
            line = f"{TEAL}{BOLD}{line}{RESET}"
        out(line + "\n")
        time.sleep(line_delay)


def step(i):
    return S["steps"][i]


def run():
    clear()
    # Boot: the last lines of the real boot log.
    boot = [l for l in S["boot"].replace("\r", "").split("\n") if l.strip()]
    for line in boot[-14:]:
        out(f"{DIM}{line}{RESET}\n" if "QNX 8.0 is up" not in line and "Type:" not in line else line + "\n")
        time.sleep(0.08)
    time.sleep(1.2)

    type_cmd(step(0)["cmd"])
    show(step(0)["out"], highlight=("QNX",))
    time.sleep(2.5)

    clear()
    caption("Every drug has a soft limit and a hard limit.")
    type_cmd(step(1)["cmd"])
    show(step(1)["out"], line_delay=0.08)
    time.sleep(2.5)
    out("\n")
    caption("A typo: 500 mL/h of chemo instead of 50.")
    type_cmd(step(2)["cmd"])
    show(step(2)["out"], highlight=("hard limit",))
    time.sleep(3.5)

    clear()
    caption("Start the pump at 50 mL/h. It shows up as a device: /dev/infusafe")
    type_cmd(step(3)["cmd"])
    show(step(3)["out"])
    time.sleep(1.0)
    type_cmd("cat /dev/infusafe")
    show(step(4)["out"], highlight=('"state"', '"motor"'))
    time.sleep(4.0)

    clear()
    caption("Block the line.")
    type_cmd('echo "inject occlusion" > /dev/infusafe')
    show(step(5)["out"])
    time.sleep(0.8)
    type_cmd(step(6)["cmd"])
    show(step(6)["out"], highlight=('"state"', '"reason"', '"motor"', '"last_stop_ms"'))
    time.sleep(5.0)

    clear()
    caption("Clear it. Now an air bubble.")
    type_cmd("echo clear > /dev/infusafe")
    show(step(7)["out"])
    type_cmd('echo "inject air" > /dev/infusafe')
    show(step(8)["out"])
    time.sleep(0.8)
    type_cmd(step(9)["cmd"])
    show(step(9)["out"], highlight=('"state"', '"reason"', '"motor"', '"last_stop_ms"'))
    time.sleep(5.0)
    type_cmd("echo quit > /dev/infusafe")
    show(step(10)["out"])
    time.sleep(1.0)

    clear()
    caption("Bench: inject every fault 5 times and time each stop.")
    bench = step(11)
    type_cmd(bench["cmd"])
    lines = bench["out"].split("\n")
    # stop before the long status block
    if any(l.startswith("status:") for l in lines):
        lines = lines[: next(i for i, l in enumerate(lines) if l.startswith("status:"))]
    head = [l for l in lines if not l.startswith(("occlusion", "free-flow", "air ", "sensor-hang", "empty-bag"))]
    rows = [l for l in lines if l.startswith(("occlusion", "free-flow", "air ", "sensor-hang", "empty-bag"))]
    show("\n".join(head).rstrip())
    # Rows appear at the pace the real run took (it took bench["seconds"]).
    gap = min(bench["seconds"], 12.0) / max(len(rows), 1)
    for r in rows:
        time.sleep(gap)
        show(r, highlight=(r,))
    time.sleep(1.0)
    out("\n")
    caption("Every fault caught. End of the QNX session.", hold=4.0)


if __name__ == "__main__":
    run()
