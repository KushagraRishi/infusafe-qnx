# Devpost submission: QNX Global Hackathon

**Category:** Robotics & Medical

**Project name:** InfuSafe

**Tagline:** A real-time safety monitor that stops a chemo pump within milliseconds when the line fails.

## Inspiration

I build SHINE, an app for people going through cancer treatment. Chemo is given through infusion pumps, and pump errors are a known source of harm in hospitals: a kinked line, a cassette that lets the drug pour in by gravity, air in the tube, a rate typed with an extra zero. The checks that catch these have to run on time, every time. That is exactly what a real-time OS is for, so I built one on QNX.

<!-- Optional: add one line of your own here about why this matters to you. -->

## What it does

InfuSafe sits next to the pump and checks it 1,000 times a second.

- **Before the pump starts**, the nurse's program is checked against a drug library. Over the soft limit, the nurse must confirm. Over the hard limit, the pump refuses. A rate of 500 mL/h typed instead of 50 never runs.
- **While it runs**, it stops the pump for a blocked line, free flow, a large air bubble, too much air over time, a sensor that goes silent, or a finished dose. An empty bag raises an alarm.
- It shows up in the QNX filesystem as `/dev/infusafe`. `cat` it for live status, `echo "inject occlusion"` into it to test a fault.
- A bench mode injects every fault many times and reports how fast the pump was stopped.

## How we built it

- C11 on QNX SDP 8.0, cross-compiled with `qcc`, booted from a custom `mkifs` image in QEMU (x86_64). Also builds for `aarch64le` (Raspberry Pi 4).
- The 1 kHz monitor and sensor loops are driven by **QNX timer pulses** (`timer_create` + `SIGEV_PULSE_INIT`, received with `MsgReceivePulse`).
- **Fixed priorities** with `SCHED_FIFO`: monitor 50, sensor 40, control 10, logger 5.
- A **resource manager** (`resmgr_attach`, `iofunc_*`) gives the device file.
- Sensor and monitor share readings through a **seqlock**, so the monitor never waits on a lock.
- The safety rules are pure C with **30 unit tests** that pass on QNX and on Linux.
- A **logger thread** at priority 5 does all the printing, so the safety loop never waits on the console.

Key files: `src/rt.c` (timer pulses, priorities), `src/control.c` (resource manager), `src/safety_rules.c` (the checks), `qnx/infusafe.build` (boot image).

## Challenges we ran into

- QNX tools have no macOS host, so the whole SDP runs in an x86_64 Linux container on an Apple Silicon Mac. The image boots in QEMU there.
- **The monitor printed its own log lines.** Writing to the serial console can block, and that held up the safety loop by up to 12 ms. Now the monitor only saves events in memory, and a low-priority thread prints them.
- **A deadlock on one CPU.** The monitor outranks the sensor thread. If it interrupted the sensor halfway through saving a reading, it waited for that reading to finish, but the sensor never got the CPU back. Both froze. Now the monitor never waits: it uses the last good reading, and if the sensor stays stuck, the silent-sensor check stops the pump.
- **A bubble could slip past.** The air detector reported each bubble in a single reading. When the monitor ran late, it missed the bubble 4 times out of 5. Now the detector keeps a running total of air, and the monitor checks what was added since it last looked. After the fix: 20 out of 20.
- Sensor noise of a few mmHg looked like a sharp pressure rise when measured over 1 ms. Measuring the rise over 15 ms removed the false alarms.

## Accomplishments that we're proud of

Every fault was injected 20 times on QNX 8.0. **100 out of 100 were caught, none missed.**

| Fault | Caught | Average time to stop |
|---|---|---|
| Blocked line | 20 of 20 | 9.7 ms |
| Free flow | 20 of 20 | 51.8 ms (it waits 50 ms on purpose) |
| Air bubble | 20 of 20 | 3.1 ms |
| Sensor goes silent | 20 of 20 | 4.4 ms |
| Empty bag (alarm) | 20 of 20 | under 0.01 ms |

That's in QEMU on a Mac, where every x86 instruction is translated to ARM. The safety check itself takes under 1 µs. And QNX helped me find three real bugs, all fixed.

## What we learned

A safety loop must never do I/O, never wait on a lock it doesn't need, and never trust a sensor that has gone quiet. QNX makes those rules easy to follow: pulses instead of sleeps, priorities that mean something, and devices that are just files.

## What's next for InfuSafe

- Real hardware: a stepper motor, pressure sensor and air detector on a Raspberry Pi 4 running QNX.
- Monitor and pump controller as separate processes, so one crashing can't take down the other.
- A signed drug library file the pharmacy can update.

## Built with

c, qnx, qnx-sdp-8.0, qemu, posix, docker, make

## Links

- Code: GITHUB_URL
- Demo video: YOUTUBE_URL
