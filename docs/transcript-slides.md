# InfuSafe pitch: what to say on each slide

This script does not read the slides. The slides show the facts; you tell the story around them. Talk to the person in front of you like you are explaining it over coffee. About 9 minutes.

Tip: look at the slide for a second when it appears, then look back at the people. Point to a picture or a number when you mention it.

---

## Slide 1. InfuSafe

Hi, I'm Kushagra.

Let me start with a simple picture. Imagine someone you love sitting in a chair, getting chemo. There's a machine next to them, quietly pushing a very strong drug into their arm, drop by drop, for hours.

Most of the time, that machine does its job perfectly. This project is about the rare moment when it doesn't, and how we catch that moment before it hurts anyone.

---

## Slide 2. Safety is our first priority

When I started, I asked myself one question: what would actually make that patient safer?

My answer was not a fancier screen or more features. It was simply this: when something goes wrong, notice it right away, and stop it.

That sounds obvious. But there's a catch, and it's the whole reason this project exists. A safety check is only useful if it happens at the right moment. A smoke alarm that rings ten minutes after the fire started is not really a smoke alarm. I'll show you why that matters in a minute.

---

## Slide 3. How a chemo infusion works

First, a quick tour, so we're all on the same page. These are real clips from a hospital.

The bag holds the medicine. The pump is the brain of the setup: the nurse tells it how fast to go, and it pushes the drug at exactly that speed. Then the tube carries it into the vein.

The important thing to notice is time. Chemo is often given slowly, on purpose, over many hours or even a couple of days, because the body can only handle it at a certain pace. So the pump is in charge of a dangerous drug for a long time, often while nobody is standing right next to it.

---

## Slide 4. Three ways it can go wrong

So what can go wrong during all those hours? Three things come up again and again.

The tube can get bent or pinched, maybe the patient just shifted in bed. Now the drug can't get through, and pressure builds up behind the block.

A bubble of air can sneak into the line. Air in a vein is dangerous.

Or the most human mistake of all: a tired person types one extra zero. Fifty becomes five hundred. Nobody did anything wrong on purpose, but the patient now gets ten times the dose.

---

## Slide 5. It really happens

And this is not a made-up example.

This patient was supposed to receive their chemo slowly, over almost two days. Because of a setup mistake on the pump, the whole two-day dose went in within about two hours. They ended up in the hospital.

Think about what that means. Nothing was wrong with the drug or the doctor's plan. One setting on one machine made the difference.

---

## Slide 6. How often

You might think, okay, but that must be very rare.

The FDA looked at this. In just five years, they received about fifty-six thousand reports of problems with infusion pumps. Eighty-seven recalls, and fourteen of those were the most serious kind.

And it's not just history. Last year, in 2024, a pump was recalled because its software, the part that is supposed to spot air bubbles, had a bug. Two people were hurt. That's the part that stuck with me: the danger came from software. And software is something I can work on.

---

## Slide 7. The gap

Now here is the problem I found that most people don't think about.

Inside a lot of devices, one program does everything. It draws the screen, reads the buttons, drives the motor, writes logs, and also checks for danger. It's like one person who is answering the phone, cooking dinner and watching the baby all at once. Usually it works. But in a busy moment, something has to wait.

I tested this myself. My safety check was supposed to run every one thousandth of a second. On a normal Linux system, sometimes it ran sixty-five times late. The check was correct. It just showed up late. And for a blocked chemo line, late is the problem.

---

## Slide 8. Our solution

So the idea behind InfuSafe is simple: give safety its own job, and make sure it's never late.

InfuSafe sits beside the pump like a lifeguard. It doesn't do anything else. It doesn't draw screens or handle buttons. It just watches: is the drug flowing, is the pressure normal, is there air?

And it gets two chances to protect the patient. First, before the pump even starts, it checks the dose against a list of safe limits for each drug. So that extra zero gets caught right there. Second, while the drug is running, if anything looks wrong, it stops the motor straight away, or calls a nurse with an alarm.

---

## Slide 9. Watch it catch a blocked line

Talking is easy, so let me show you. This is the real system running, not a mockup.

Here I pretend the tube gets blocked. Watch the line that says STOP. InfuSafe noticed the problem and stopped the pump in about nine thousandths of a second. That's around thirty times faster than you can blink.

---

## Slide 10. Who it helps

So who does this actually help?

The patient, obviously. But think about the nurse too. Nurses look after many patients at once. InfuSafe is like a second pair of eyes that never gets tired at 3 a.m. and double-checks every number they type.

For a hospital, it's one more safety net under every pump. And for the companies that make pumps, it's a ready-made safety part they can build on, instead of starting from zero.

---

## Slide 11. Built to scale

And the reason I'm excited is how far this can reach.

Almost every patient in a hospital gets medicine through an IV at some point. That's a huge number of people connected to these pumps every single day.

InfuSafe is just software, and it's very light. It uses a tiny slice of the computer's power, so it can run on small, cheap chips inside the pump. You don't need to throw away pumps and buy new ones. And because it's open source, any company can test it and use it.

---

## Slide 12. Why QNX

Now, why did I build it on QNX?

Remember the person who was cooking and watching the baby at the same time? QNX solves that. On QNX, I can say: this job is the most important, and it always goes first. No matter how busy the system is, the safety check gets its turn on time. It's like an ambulance on the road: everyone else pulls over.

And this isn't just a promise. This is the actual code. The system itself wakes up the safety check every thousandth of a second, like a heartbeat.

---

## Slide 13. Results

So does it actually work? I tried to break it, a lot.

I created each kind of problem twenty times, a hundred tests in total. InfuSafe caught every single one. Not one slipped through.

An air bubble is caught in about three thousandths of a second. A blocked line in about ten. And the check itself is so fast it takes less than a millionth of a second, which is why it can run nonstop without slowing anything down.

---

## Slide 14. Real engineering

I also want to be honest about the journey, because I think it matters.

When I first ran this on QNX, it found three real problems in my own code. Things that never showed up on my laptop. One of them meant that, in a rare case, an air bubble could slip past.

I fixed all three, and I'm glad I found them in testing and not in a hospital. That's exactly why safety software should be tested on a real-time system like this.

---

## Slide 15. Built to meet every judging point

So, to bring it together.

It's built properly on real QNX technology. It's a complete product, not just a quick demo. It's aimed at a real danger that has hurt real people. And the idea itself, giving safety its own protected job, is simple enough that anyone can understand it.

---

## Slide 16. Thank you

What's next? I want to connect InfuSafe to real pump hardware, and work toward the safety approvals a medical device needs.

Let's go back to that person in the chair, getting their chemo. They will never know InfuSafe is there. And that's the point. Safety should never have to wait.

Thank you. I'd love to hear your questions.
