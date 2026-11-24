# InfuSafe demo video: full transcript (2:51)

Read each line when its time comes up. Calm, normal pace. Every line fits its window with a little room to spare. Pause where a line ends; the picture carries the gap.

## Part 1. The problem (real footage)

| Time | On screen | Say |
|---|---|---|
| 0:00 | Chemo patient, title | Chemo is given through an infusion pump. |
| 0:04 | Drip, pump, IV in the arm | The drug drips from a bag. A pump pushes it down a thin tube, into the vein. |
| 0:10 | Red kink on the tube | But things go wrong. A tube gets kinked. |
| 0:13 | Bubble in the line | Air gets into the line. |
| 0:15 | Nurse at the pump, "500" | Someone types 500 instead of 50. |
| 0:18 | 56,000 counter | From 2005 to 2009, the FDA got about 56,000 reports of problems with infusion pumps. |
| 0:24 | Inside the pump, one program | If one program runs the screen, the buttons, the motor and the alarms, a busy moment can make the safety check wait its turn. |

## Part 2. The fix (animation)

| Time | On screen | Say |
|---|---|---|
| 0:32 | InfuSafe appears | InfuSafe is a separate safety monitor. It runs on QNX, a real-time operating system, and checks the pump 1,000 times every second. |
| 0:40 | Priority race | Its check always runs first. Nothing else can push it aside. |
| 0:46 | STOP, 10 ms, then 3 ms | When the line gets blocked, it stops the pump in about 10 milliseconds. An air bubble, in about 3. |
| 0:53 | 100 of 100 | In our tests, it caught 100 out of 100 faults. On time, every time. |

## Part 3. Live on QNX 8.0 (the real terminal)

| Time | On screen | Say |
|---|---|---|
| 0:58 | "Running on real QNX 8.0" | Here it is, running live. |
| 1:01 | QNX boots | This is QNX 8.0, booted in QEMU from an image I built. |
| 1:06 | Drug limits, the 500 typo | Every drug has a soft limit and a hard limit. Type 500 instead of 50, and the pump will not start. |
| 1:15 | Pump starts, /dev/infusafe | At 50, it starts, and the monitor shows up as a device file. |
| 1:23 | Block the line | Now I block the line. The pump stops in about 9 milliseconds. |
| 1:32 | Air bubble | I clear it, and send in an air bubble. Stopped in under 3 milliseconds. |
| 1:44 | Bench table | The bench injects every fault five times. Every one is caught. |

## Part 4. How it uses QNX (for the judges)

| Time | On screen | Say |
|---|---|---|
| 1:57 | Diagram builds | So how does it use QNX? |
| 2:01 | Timer pulse | A kernel timer pulse wakes the safety monitor every millisecond. It runs at priority 50, above everything else. |
| 2:08 | Lock-free reading | The sensor shares its readings without locks, so the monitor never waits. |
| 2:12 | /dev/infusafe | The pump is a QNX resource manager, so any shell can read it or test it. |
| 2:17 | Code callouts | It is built on timer pulses, message passing, a resource manager, and a custom boot image. |

## Part 5. Bugs, product, end

| Time | On screen | Say |
|---|---|---|
| 2:19 | 3 bugs cards | Running on QNX found three real bugs. |
| 2:23 | Cards turn green | Printing that could block the monitor. A deadlock on one CPU. A bubble that could slip past. |
| 2:30 | 30 of 30 tests | All fixed. All 30 tests pass on QNX. |
| 2:33 | Checklist | It is a complete product: drug limits, a live device, a fault bench, tests, and a bootable image. |
| 2:43 | End card | InfuSafe. On time, every time. The code is on GitHub. |

## Tips for recording

- Record in a quiet room, phone about a hand's length from your mouth.
- One take is fine. If you trip on a line, pause, and say the whole line again. I will cut it.
- Send me the audio file (any format). I will line it up with the picture and balance it with the sound effects.
