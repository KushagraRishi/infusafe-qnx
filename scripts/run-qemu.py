#!/usr/bin/env python3
"""
Boot the InfuSafe QNX image in QEMU and type commands into its serial
console. Everything QNX prints is shown and saved to build/qemu.log.

  scripts/run-qemu.py                      # boot, run demo.sh, power off
  scripts/run-qemu.py "infusafe -b 100"    # boot, run these commands
  scripts/run-qemu.py --interactive        # boot and hand you the console
"""
import os
import subprocess
import sys
import threading
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
IMAGE = os.path.join(ROOT, "build", "infusafe.ifs")
LOG = os.path.join(ROOT, "build", "qemu.log")

QEMU = [
    "qemu-system-x86_64",
    "-m", "512", "-smp", "1",
    "-cpu", "max",
    # Instruction-count clock: guest time stays steady even though the
    # Mac is translating x86 to ARM.
    "-icount", "shift=auto,align=off,sleep=on",
    "-kernel", IMAGE,
    "-display", "none",
    "-serial", "stdio",
    "-monitor", "none",
    "-no-reboot",
]


def main():
    args = sys.argv[1:]
    if args == ["--interactive"]:
        os.execvp(QEMU[0], QEMU)

    commands = args or ["demo.sh"]
    out = open(LOG, "w")
    buf = []
    proc = subprocess.Popen(QEMU, stdin=subprocess.PIPE, stdout=subprocess.PIPE,
                            stderr=subprocess.STDOUT, bufsize=0)

    def reader():
        while True:
            chunk = proc.stdout.read(1)
            if not chunk:
                break
            ch = chunk.decode("utf-8", "replace")
            buf.append(ch)
            out.write(ch)
            sys.stdout.write(ch)
            sys.stdout.flush()

    threading.Thread(target=reader, daemon=True).start()

    def wait_for(text, timeout):
        end = time.time() + timeout
        while time.time() < end:
            if text in "".join(buf):
                return True
            time.sleep(0.2)
        return False

    if not wait_for("Type: infusafe", 180):
        print("\n[run-qemu] QNX did not boot in time", file=sys.stderr)
        proc.kill()
        return 1
    time.sleep(1)

    for cmd in commands:
        proc.stdin.write((cmd + "\n").encode())
        proc.stdin.flush()
    # A marker so we know the commands are done.
    proc.stdin.write(b"echo __INFUSAFE_DONE__\n")
    proc.stdin.flush()

    joined = lambda: "".join(buf)
    end = time.time() + 3000
    while time.time() < end:
        # The marker shows once as the typed command and once as output.
        if joined().count("__INFUSAFE_DONE__") >= 2:
            break
        time.sleep(0.5)
    time.sleep(0.5)
    proc.kill()
    out.close()
    print(f"\n[run-qemu] log saved to {LOG}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
