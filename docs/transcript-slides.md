# InfuSafe pitch: what to say on each slide

About 8 minutes in total. Speak slowly. Each slide's animation plays by itself, so start talking once the slide appears.

---

## Slide 1. InfuSafe

Hi, I'm Kushagra Chaudhary. This is InfuSafe.

When someone gets chemo, a machine called an infusion pump pushes the drug into their vein. InfuSafe is a safety guardian for that pump. It watches the pump a thousand times every second, and it stops the pump the moment something goes wrong. I built it on QNX 8.0.

---

## Slide 2. The challenge

This hackathon's Robotics and Medical track asked for one thing: real-time systems where timing, safety, or reliability is critical.

So I asked myself, where does timing matter most? I think it's right here: a chemo drug going into a patient's vein. If something goes wrong, every second counts.

---

## Slide 3. The problem

A chemo pump can hurt a patient in three common ways.

First, the tube gets kinked. The drug stops flowing, and pressure builds up in the line.

Second, air gets into the line, and a bubble moves toward the vein.

Third, someone types the wrong number. For example, 500 instead of 50. That is ten times the dose.

---

## Slide 4. It really happens

This is a real case. A patient was supposed to get a chemo drug slowly, over 46 hours. But the pump was set up wrong, and the whole dose went in within about 2 hours. The patient had to be admitted to hospital.

One wrong setting. That's all it took.

---

## Slide 5. How often

And this is not rare. In just five years, the FDA got about 56,000 reports of problems with infusion pumps. There were 87 recalls, and 14 of them were in the most serious class.

It's still happening. In 2024, a pump was recalled because a software bug could let an air bubble reach the patient. Two people were hurt. A software safety bug. That is exactly the kind of problem I want to stop.

---

## Slide 6. The gap

Here is the hidden problem. A safety check only helps if it runs on time.

In many systems, one program does everything: the screen, the buttons, the motor, the logs. When it gets busy, the safety check has to wait in line.

I measured this myself. My check was supposed to run every 1 millisecond. On a normal Linux setup, it was sometimes 65 milliseconds late. The check was right, but it came too late.

---

## Slide 7. Our solution

So I built InfuSafe. Think of it as a guardian that never looks away.

It sits beside the pump as its own separate monitor. It checks the flow, the pressure and the air a thousand times a second. It blocks unsafe doses before the pump even starts, so 500 instead of 50 never runs. It stops the pump in milliseconds. And it's easy to check and test, because it shows up as a simple device file.

---

## Slide 8. Who it helps

This helps everyone around the infusion.

Patients: overdoses, air bubbles and blocked lines get stopped before they can do harm.
Nurses: they get a second set of eyes that catches a typo.
Hospitals: an extra layer of protection on every pump.
And pump makers: a ready, open-source safety layer they can build on.

---

## Slide 9. Why QNX

Why did I use QNX? Because the whole idea is timing.

On QNX, safety always goes first. My safety check runs at the highest priority, and nothing can push it aside. The QNX kernel itself wakes the monitor every millisecond, like a heartbeat. And the parts stay separate, so one fault does not spread.

On the right, you can see exactly where each QNX feature lives in my code, so the judges can check it.

---

## Slide 10. Live demo

Here it is, running for real on QNX 8.0.

(Click the video to play it.)

QNX boots from my own system image. I try to start the pump at 500, and it refuses. At 50, it starts safely. Then I block the line, and InfuSafe stops the pump in about 9 milliseconds. Then I send in an air bubble, and it stops in about 3.

---

## Slide 11. Results

So how well does it work? I tested every fault 20 times. That's 100 tests, and InfuSafe caught all 100. Not one was missed.

An air bubble is stopped in about 3 milliseconds. A blocked line in about 10. Free flow takes about 50, on purpose, so a tiny spike doesn't stop the pump for no reason. And the safety check itself takes less than one millionth of a second.

---

## Slide 12. Real engineering

Testing on QNX also found three real bugs in my code, and I fixed all three.

The monitor could be held up by printing to the screen. Now a low-priority helper does the printing.
Two parts of the program could freeze each other. Now the monitor never waits.
And a bubble could slip past a late check. Now it catches 20 out of 20.

This is exactly why safety code should be tested on a real-time system.

---

## Slide 13. Built to meet every judging point

To sum up.

Technology: InfuSafe uses real QNX features: timer pulses, real-time priorities, a resource manager, and my own QNX boot image.
Design: it's a complete product, not just a test.
Impact: it targets a real, documented danger in hospitals.
Innovation: safety lives in its own real-time guardian that anyone can test.

---

## Slide 14. Thank you

Next, I want to run InfuSafe on real pump hardware, split it into separate QNX processes, and work toward medical safety certification.

Because safety should never have to wait.

Thank you. All my code is on GitHub. I'm happy to take your questions.
