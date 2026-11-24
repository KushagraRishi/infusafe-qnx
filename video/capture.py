#!/usr/bin/env python3
"""
Runs the demo commands on QNX 8.0 in QEMU and saves exactly what QNX
printed for each one, to build/video/session.json. replay.py plays it
back at a readable pace for the video.
"""
import json
import os
import subprocess
import sys
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "scripts"))
OUT = os.path.join(ROOT, "build", "video", "session.json")

# (command, seconds to wait at most for the prompt to come back)
COMMANDS = [
    ("uname -a", 30),
    ("infusafe -l", 30),
    ("infusafe -d chemo-a -r 500 -v 200", 30),
    ("infusafe -d chemo-a -r 50 -v 200 &", 30),
    ("sleep 1; cat /dev/infusafe", 30),
    ('echo "inject occlusion" > /dev/infusafe; sleep 1', 30),
    ("cat /dev/infusafe", 30),
    ("echo clear > /dev/infusafe; sleep 1", 30),
    ('echo "inject air" > /dev/infusafe; sleep 1', 30),
    ("cat /dev/infusafe", 30),
    ("echo quit > /dev/infusafe; sleep 2", 30),
    ("infusafe -b 5", 2400),
]


def main():
    import importlib.util
    spec = importlib.util.spec_from_file_location("rq", os.path.join(ROOT, "scripts", "run-qemu.py"))
    rq = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rq)

    proc = subprocess.Popen(rq.QEMU, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, bufsize=0)
    buf = []
    lock = threading.Lock()

    def reader():
        while True:
            b = proc.stdout.read(1)
            if not b:
                break
            with lock:
                buf.append(b.decode("utf-8", "replace"))

    threading.Thread(target=reader, daemon=True).start()
    text = lambda: "".join(buf)

    def wait_for(pred, timeout):
        end = time.time() + timeout
        while time.time() < end:
            with lock:
                t = text()
            if pred(t):
                return True
            time.sleep(0.2)
        return False

    if not wait_for(lambda t: "Type: infusafe" in t, 300):
        print("QNX did not boot", file=sys.stderr)
        proc.kill()
        return 1
    time.sleep(1.5)
    with lock:
        boot = text()
    session = {"boot": boot, "steps": []}

    for i, (cmd, timeout) in enumerate(COMMANDS):
        marker = f"__STEP_{i}_DONE__"
        with lock:
            start = len(buf)
        t0 = time.time()
        sep = " " if cmd.rstrip().endswith("&") else "; "
        proc.stdin.write(f"{cmd}{sep}echo {marker}\n".encode())
        proc.stdin.flush()
        # the marker shows up once as typed text and once as output
        ok = wait_for(lambda t: t[start:].count(marker) >= 2, timeout)
        time.sleep(0.3)
        with lock:
            out = text()[start:]
        # keep only what the command printed: drop the echoed command line and the marker
        lines = out.replace("\r", "").split("\n")
        lines = [l for l in lines if marker not in l]
        lines = [l for l in lines if l.strip() not in ("#", "# ")]
        session["steps"].append({"cmd": cmd, "out": "\n".join(lines).strip("\n"),
                                 "seconds": round(time.time() - t0, 1), "ok": ok})
        print(f"[{i}] {cmd!r}: {'ok' if ok else 'TIMEOUT'} in {time.time() - t0:.1f}s", flush=True)
        if not ok:
            break

    proc.kill()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w") as f:
        json.dump(session, f, indent=1)
    print("saved", OUT)
    return 0


if __name__ == "__main__":
    sys.exit(main())
