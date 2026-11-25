// InfuSafe pitch deck, v2: clean, light and positive. Real photos, one idea per slide.
// Shapes named "aN|..." get a soft fade-in, in order N, added by add_animations.py.
const pptxgen = require('pptxgenjs');
const fs = require('fs');
const path = require('path');
const React = require('react');
const ReactDOMServer = require('react-dom/server');
const sharp = require('sharp');
const fa = require('react-icons/fa');
const { applyTheme } = require(path.join(process.env.PPTX_SKILL, 'scripts/apply_theme.js'));

const A = (f) => path.join(__dirname, 'assets', f);
const img = (f) => 'image/jpeg;base64,' + fs.readFileSync(A(f)).toString('base64');

const THEME = {
  name: 'InfuSafe Clear',
  headFontFace: 'Georgia',
  bodyFontFace: 'Arial',
  colors: {
    dk1: '1B2430', lt1: 'FFFFFF', dk2: '0F4C47', lt2: 'F3F8F7',
    accent1: '0FA58F', accent2: 'F5A524', accent3: 'E8604C', accent4: '3D6FE0', accent5: '6B7A88', accent6: 'DDF2EE',
    hlink: '0FA58F', folHlink: '0F4C47',
  },
};
const X = THEME.colors;

async function icon(Comp, color) {
  const svg = ReactDOMServer.renderToStaticMarkup(React.createElement(Comp, { color: '#' + color, size: 256 }));
  return 'image/png;base64,' + (await sharp(Buffer.from(svg)).resize(256, 256).png().toBuffer()).toString('base64');
}

(async () => {
  const pres = new pptxgen();
  pres.layout = 'LAYOUT_WIDE';
  pres.title = 'InfuSafe'; pres.author = 'Kushagra Chaudhary'; pres.subject = 'QNX Global Hackathon, Robotics and Medical';
  pres.theme = { headFontFace: THEME.headFontFace, bodyFontFace: THEME.bodyFontFace };
  const C = pres.SchemeColor;

  pres.defineSlideMaster({ title: 'COVER', background: { color: X.dk2 }, objects: [] });
  pres.defineSlideMaster({
    title: 'CONTENT', background: { color: X.lt1 },
    objects: [
      { placeholder: { options: { name: 'title', type: 'title', x: 0.7, y: 0.78, w: 11.9, h: 0.8, fontSize: 32, bold: true, color: C.text1, fontFace: 'Georgia', align: 'left', valign: 'top', margin: 0 }, text: '' } },
      { text: { text: 'InfuSafe', options: { x: 0.7, y: 7.0, w: 4, h: 0.3, fontSize: 11, bold: true, color: C.accent1, margin: 0 } } },
    ],
    slideNumber: { x: 12.1, y: 7.0, w: 0.5, h: 0.3, fontSize: 11, color: X.accent5, align: 'right' },
  });

  const content = (sec, eyebrow, title) => {
    const s = pres.addSlide({ masterName: 'CONTENT', sectionTitle: sec });
    s.addText(eyebrow, { x: 0.7, y: 0.42, w: 8, h: 0.3, fontSize: 12, bold: true, color: C.accent1, charSpacing: 3, margin: 0, isTextBox: true, objectName: 'eyebrow' });
    s.addText(title, { placeholder: 'title' });
    return s;
  };
  const shadow = () => ({ type: 'outer', color: '1B2430', opacity: 0.16, blur: 14, offset: 4, angle: 90 });
  const photo = (s, f, x, y, w, h, name, cover = true) =>
    s.addImage({ data: img(f), x, y, w, h, sizing: cover ? { type: 'cover', w, h } : undefined, shadow: shadow(), objectName: name, altText: name.split('|')[1] || name });
  const tint = (s, x, y, w, h, color, name, line) =>
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.2, fill: { color }, line: { color: line || color, width: line ? 1 : 0 }, objectName: name });
  const circleIcon = async (s, x, y, d, bg, Ic, name) => {
    s.addShape(pres.shapes.OVAL, { x, y, w: d, h: d, fill: { color: bg }, line: { color: bg, width: 0 }, objectName: name + ' circle' });
    s.addImage({ data: await icon(Ic, 'FFFFFF'), x: x + d * 0.25, y: y + d * 0.25, w: d * 0.5, h: d * 0.5, objectName: name + ' icon', altText: name });
  };
  const row = async (s, k, x, y, w, Ic, bg, head, body) => {
    await circleIcon(s, x, y, 0.7, bg, Ic, `a${k}|row ${head}`);
    s.addText([
      { text: head, options: { bold: true, fontSize: 19, color: C.text1, breakLine: true } },
      { text: body, options: { fontSize: 16, color: C.accent5 } },
    ], { x: x + 0.95, y: y - 0.05, w: w - 0.95, h: 0.95, valign: 'top', margin: 0, paraSpaceAfter: 2, isTextBox: true, objectName: `a${k}|text ${head}` });
  };
  const source = (s, t) => s.addText(t, { x: 0.7, y: 6.55, w: 11.9, h: 0.3, fontSize: 10, color: C.accent5, margin: 0, isTextBox: true, objectName: 'source' });

  // ============ 1. Cover ============
  pres.addSection({ title: 'Opening' });
  let s = pres.addSlide({ masterName: 'COVER', sectionTitle: 'Opening' });
  s.addImage({ data: img('photos/patient.jpg'), x: 6.9, y: 0, w: 6.433, h: 7.5, sizing: { type: 'cover', w: 6.433, h: 7.5 }, objectName: 'a1|photo patient in chemo', altText: 'A patient receiving chemo through an IV' });
  s.addText('QNX HACKATHON  ·  ROBOTICS & MEDICAL', { x: 0.8, y: 1.25, w: 6.0, h: 0.35, fontSize: 12, bold: true, color: C.accent2, charSpacing: 2, margin: 0, isTextBox: true, objectName: 'a1|eyebrow' });
  s.addText('InfuSafe', { x: 0.8, y: 1.8, w: 5.9, h: 1.2, fontSize: 64, bold: true, color: C.background1, fontFace: 'Georgia', margin: 0, isTextBox: true, objectName: 'a1|title' });
  s.addText('Keeping chemo pumps safe, one millisecond at a time', { x: 0.8, y: 3.15, w: 5.6, h: 1.1, fontSize: 26, color: 'DDF2EE', fontFace: 'Georgia', italic: true, margin: 0, isTextBox: true, objectName: 'a2|tagline' });
  s.addText('An independent real-time safety monitor, built on QNX 8.0', { x: 0.8, y: 4.45, w: 5.6, h: 0.6, fontSize: 17, color: C.background1, margin: 0, isTextBox: true, objectName: 'a3|what' });
  s.addText([
    { text: 'Kushagra Chaudhary', options: { bold: true, color: C.background1, breakLine: true } },
    { text: 'github.com/KushagraRishi/infusafe-qnx', options: { color: C.accent2 } },
  ], { x: 0.8, y: 5.75, w: 5.6, h: 0.8, fontSize: 15, margin: 0, isTextBox: true, objectName: 'a3|presenter' });

  // ============ 2. The challenge ============
  pres.addSection({ title: 'The challenge' });
  s = content('The challenge', 'THE CHALLENGE', 'The hackathon asked for safety that runs on time');
  tint(s, 0.7, 1.95, 6.3, 4.3, X.accent6, 'a1|quote card');
  s.addText('ROBOTICS & MEDICAL TRACK', { x: 1.15, y: 2.35, w: 5.4, h: 0.3, fontSize: 12, bold: true, color: C.text2, charSpacing: 2, margin: 0, isTextBox: true, objectName: 'a1|track' });
  s.addText('“Real-time applications where timing, safety, or reliability is critical.”', { x: 1.15, y: 2.85, w: 5.4, h: 2.3, fontSize: 30, italic: true, color: C.text2, fontFace: 'Georgia', margin: 0, valign: 'top', isTextBox: true, objectName: 'a1|quote' });
  s.addText('QNX Global Hackathon, official rules', { x: 1.15, y: 5.5, w: 5.4, h: 0.35, fontSize: 13, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a1|quote source' });
  photo(s, 'photos/hand.jpg', 7.5, 1.95, 5.1, 2.87, 'a2|photo IV line in a patient arm');
  s.addText([
    { text: 'We picked the place where timing matters most: ', options: { color: C.text1 } },
    { text: 'a chemo drug going into a vein.', options: { color: C.accent1, bold: true } },
  ], { x: 7.5, y: 5.1, w: 5.1, h: 1.1, fontSize: 18, margin: 0, valign: 'top', isTextBox: true, objectName: 'a3|our pick' });

  // ============ 3. The problem ============
  pres.addSection({ title: 'The problem' });
  s = content('The problem', 'THE PROBLEM', 'Three ways a chemo pump can hurt a patient');
  photo(s, 'photos/pump_tall.jpg', 0.7, 1.9, 2.9, 4.5, 'a1|photo infusion pump on a pole');
  await row(s, 2, 4.3, 2.1, 8.3, fa.FaCompressArrowsAlt, X.accent3, 'The tube gets kinked', 'The drug stops flowing and pressure builds up in the line.');
  await row(s, 3, 4.3, 3.55, 8.3, fa.FaCircle, X.accent3, 'Air gets into the line', 'A bubble travels down the tube toward the vein.');
  await row(s, 4, 4.3, 5.0, 8.3, fa.FaKeyboard, X.accent3, 'A wrong number is typed', '500 mL per hour instead of 50. Ten times the dose.');

  // ============ 4. Real case ============
  s = content('The problem', 'IT REALLY HAPPENS', 'One wrong setting turned 46 hours into 2');
  s.addText('Planned', { x: 0.7, y: 2.15, w: 2.2, h: 0.4, fontSize: 16, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a1|planned label' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 2.6, w: 9.6, h: 0.75, rectRadius: 0.2, fill: { color: X.accent1 }, line: { color: X.accent1, width: 0 }, objectName: 'a1|planned bar' });
  s.addText('46 hours', { x: 10.5, y: 2.55, w: 2.2, h: 0.85, fontSize: 34, bold: true, color: C.accent1, fontFace: 'Georgia', margin: 0, valign: 'middle', isTextBox: true, objectName: 'a1|planned value' });
  s.addText('What the pump delivered', { x: 0.7, y: 3.75, w: 5, h: 0.4, fontSize: 16, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a2|actual label' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 4.2, w: 0.42, h: 0.75, rectRadius: 0.2, fill: { color: X.accent3 }, line: { color: X.accent3, width: 0 }, objectName: 'a2|actual bar' });
  s.addText('about 2 hours', { x: 1.35, y: 4.15, w: 4, h: 0.85, fontSize: 34, bold: true, color: C.accent3, fontFace: 'Georgia', margin: 0, valign: 'middle', isTextBox: true, objectName: 'a2|actual value' });
  s.addText([
    { text: '4,500 mg of the chemo drug fluorouracil, meant for two days, went in within about two hours. ', options: { color: C.text1 } },
    { text: 'The patient had to be admitted to hospital.', options: { color: C.text1, bold: true } },
  ], { x: 0.7, y: 5.35, w: 11.9, h: 0.9, fontSize: 19, margin: 0, valign: 'top', isTextBox: true, objectName: 'a3|story' });
  source(s, 'Source: ISMP Medication Safety Alert!, June 18, 2015, "Accidental overdoses involving fluorouracil infusions"');

  // ============ 5. How often ============
  s = content('The problem', 'HOW OFTEN', 'Pump problems are common, and still happening');
  const stats = [['56,000', 'reports of pump problems sent to the FDA', X.accent1], ['87', 'pump recalls in those same five years', X.accent1], ['14', 'of them in the most serious class (Class I)', X.accent3]];
  stats.forEach(([n, l, c], i) => {
    const x = 0.7 + i * 4.05;
    s.addText(n, { x, y: 1.95, w: 3.8, h: 1.1, fontSize: 60, bold: true, color: c, fontFace: 'Georgia', margin: 0, isTextBox: true, objectName: `a${i + 1}|stat ${n}` });
    s.addText(l, { x, y: 3.1, w: 3.6, h: 0.9, fontSize: 17, color: C.text1, margin: 0, valign: 'top', isTextBox: true, objectName: `a${i + 1}|stat label ${n}` });
  });
  s.addText('FDA, 2005 to 2009', { x: 0.7, y: 4.0, w: 6, h: 0.3, fontSize: 12, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a3|stat period' });
  tint(s, 0.7, 4.6, 11.9, 1.6, 'FFF3DD', 'a4|recent card');
  await circleIcon(s, 1.05, 5.05, 0.7, X.accent2, fa.FaBell, 'a4|recent icon');
  s.addText([
    { text: 'And in 2024: ', options: { bold: true, color: C.text1 } },
    { text: 'an FDA Class I recall. A software bug in air detection could let a 1 mL air bubble reach the patient. Two people were injured.', options: { color: C.text1 } },
  ], { x: 2.0, y: 4.85, w: 10.3, h: 1.1, fontSize: 18, margin: 0, valign: 'middle', isTextBox: true, objectName: 'a4|recent text' });
  source(s, 'Sources: FDA Infusion Pump Improvement Initiative (2010); FDA recall notice for Z-800 series pumps (2024)');

  // ============ 6. The gap ============
  s = content('The problem', 'THE GAP', 'A safety check only helps if it runs on time');
  s.addText('When the screen, the buttons, the motor and the logs share one program, a busy moment can make the safety check wait in line. I measured it.', { x: 0.7, y: 1.85, w: 11.9, h: 0.9, fontSize: 19, color: C.text1, margin: 0, valign: 'top', isTextBox: true, objectName: 'a1|gap text' });
  s.addText('Planned: a check every 1 ms', { x: 0.7, y: 3.05, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a2|planned label' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 3.5, w: 0.16, h: 0.6, rectRadius: 0.06, fill: { color: X.accent1 }, line: { color: X.accent1, width: 0 }, objectName: 'a2|planned bar' });
  s.addText('1 ms', { x: 1.0, y: 3.45, w: 2, h: 0.7, fontSize: 26, bold: true, color: C.accent1, fontFace: 'Georgia', margin: 0, valign: 'middle', isTextBox: true, objectName: 'a2|planned value' });
  s.addText('Worst delay I saw on Linux in Docker', { x: 0.7, y: 4.45, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a3|delay label' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 4.9, w: 10.4, h: 0.6, rectRadius: 0.2, fill: { color: X.accent3 }, line: { color: X.accent3, width: 0 }, objectName: 'a3|delay bar' });
  s.addText('65 ms', { x: 11.3, y: 4.85, w: 1.4, h: 0.7, fontSize: 26, bold: true, color: C.accent3, fontFace: 'Georgia', margin: 0, valign: 'middle', isTextBox: true, objectName: 'a3|delay value' });
  s.addText('65 times later than planned. The check was right, but it came too late.', { x: 0.7, y: 5.8, w: 11.9, h: 0.5, fontSize: 18, bold: true, color: C.text2, margin: 0, isTextBox: true, objectName: 'a4|takeaway' });

  // ============ 7. Solution ============
  pres.addSection({ title: 'The solution' });
  s = content('The solution', 'OUR SOLUTION', 'InfuSafe: a guardian that never looks away');
  photo(s, 's_38.00.jpg', 0.7, 1.95, 6.0, 3.375, 'a1|InfuSafe guardian beside the pump', false);
  s.addText('A separate safety monitor that sits beside the pump. It is not another alarm inside the same busy program.', { x: 0.7, y: 5.55, w: 6.0, h: 0.8, fontSize: 15, color: C.accent5, margin: 0, valign: 'top', isTextBox: true, objectName: 'a1|caption' });
  await row(s, 2, 7.3, 1.95, 5.4, fa.FaHeartbeat, X.accent1, 'Checks 1,000 times a second', 'Flow, pressure and air, every millisecond.');
  await row(s, 3, 7.3, 3.05, 5.4, fa.FaShieldAlt, X.accent1, 'Blocks unsafe doses', 'A drug library stops 500 instead of 50 before it starts.');
  await row(s, 4, 7.3, 4.15, 5.4, fa.FaHandPaper, X.accent1, 'Stops the pump fast', 'In milliseconds, when the line blocks or air appears.');
  await row(s, 5, 7.3, 5.25, 5.4, fa.FaSearch, X.accent1, 'Easy to check and test', 'It shows up as a device: /dev/infusafe.');

  // ============ 8. Who it helps ============
  s = content('The solution', 'WHO IT HELPS', 'More safety for everyone around the infusion');
  const helps = [
    [fa.FaUserInjured, X.accent3, 'Patients', 'Overdoses, air bubbles and blocked lines get stopped before they can do harm.'],
    [fa.FaUserNurse, X.accent1, 'Nurses', 'A second set of eyes that catches a typo before the pump starts.'],
    [fa.FaHospital, X.accent4, 'Hospitals', 'Fewer harmful events, and an extra layer of protection on every pump.'],
    [fa.FaIndustry, X.accent2, 'Pump makers', 'A ready, open-source safety layer on QNX, which already serves medical devices.'],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.7 + i * 3.02;
    tint(s, x, 1.95, 2.8, 4.25, X.lt2, `a${i + 1}|help card ${helps[i][2]}`);
    await circleIcon(s, x + 0.35, 2.3, 0.85, helps[i][1], helps[i][0], `a${i + 1}|help ${helps[i][2]}`);
    s.addText([
      { text: helps[i][2], options: { bold: true, fontSize: 21, color: C.text1, fontFace: 'Georgia', breakLine: true } },
      { text: helps[i][3], options: { fontSize: 16, color: C.text1 } },
    ], { x: x + 0.35, y: 3.4, w: 2.15, h: 2.6, valign: 'top', margin: 0, paraSpaceAfter: 8, isTextBox: true, objectName: `a${i + 1}|help text ${helps[i][2]}` });
  }

  // ============ 9. Why QNX ============
  s = content('The solution', 'WHY QNX', 'Real-time QNX makes safety arrive on time');
  await row(s, 1, 0.7, 1.95, 5.6, fa.FaSortAmountUp, X.accent1, 'Safety always goes first', 'The check runs at priority 50, the logs at 5.');
  await row(s, 2, 0.7, 3.2, 5.6, fa.FaClock, X.accent1, 'The kernel keeps time', 'A QNX timer pulse wakes the monitor every 1 ms.');
  await row(s, 3, 0.7, 4.45, 5.6, fa.FaCubes, X.accent1, 'Parts stay separate', 'The microkernel keeps one fault from spreading.');
  const T = [['What QNX gives us', 'Where it is in the code'], ['Kernel timer pulses', 'src/rt.c'], ['Real-time priorities', 'src/rt.c, src/main.c'], ['Resource manager: /dev/infusafe', 'src/control.c'], ['Our own boot image (mkifs)', 'qnx/infusafe.build'], ['30 tests pass on QNX 8.0', 'tests/test_rules.c']];
  s.addTable(T.map((r, i) => r.map((c, j) => ({ text: c, options: { bold: i === 0, fontSize: i === 0 ? 14 : 15, color: i === 0 ? X.lt1 : X.dk1, fontFace: j === 1 && i > 0 ? 'Courier New' : 'Arial', fill: { color: i === 0 ? X.dk2 : (i % 2 ? X.lt2 : X.lt1) } } }))), {
    x: 6.75, y: 1.95, w: 5.85, colW: [3.25, 2.6], rowH: 0.62, border: { type: 'solid', color: 'E3ECEA', pt: 1 }, valign: 'middle', margin: [0, 0.12, 0, 0.12], objectName: 'a4|QNX table',
  });

  // ============ 10. Live demo ============
  pres.addSection({ title: 'Proof' });
  s = content('Proof', 'LIVE DEMO', 'Running on real QNX 8.0');
  s.addMedia({ type: 'video', path: A('clip_live.mp4'), cover: img('poster_live.jpg'), x: 0.7, y: 1.95, w: 7.6, h: 4.275, objectName: 'demo video' });
  const steps = ['QNX boots from my own image', 'It refuses 500 mL per hour', 'It starts safely at 50', 'A blocked line: stopped in 9 ms', 'An air bubble: stopped in 3 ms'];
  steps.forEach((t, i) => {
    const y = 2.0 + i * 0.84;
    s.addShape(pres.shapes.OVAL, { x: 8.8, y, w: 0.55, h: 0.55, fill: { color: X.accent1 }, line: { color: X.accent1, width: 0 }, objectName: `step ${i + 1} dot` });
    s.addText(String(i + 1), { x: 8.8, y, w: 0.55, h: 0.55, fontSize: 16, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: `step ${i + 1} num` });
    s.addText(t, { x: 9.55, y: y - 0.02, w: 3.1, h: 0.6, fontSize: 16, color: C.text1, valign: 'middle', margin: 0, isTextBox: true, objectName: `step ${i + 1} text` });
  });

  // ============ 11. Results ============
  s = content('Proof', 'RESULTS', 'Every fault caught, in milliseconds');
  s.addText('100 / 100', { x: 0.7, y: 1.95, w: 4.6, h: 1.25, fontSize: 66, bold: true, color: C.accent1, fontFace: 'Georgia', margin: 0, isTextBox: true, objectName: 'a1|stat 100' });
  s.addText('faults caught, none missed. 20 tries of each of 5 faults.', { x: 0.7, y: 3.2, w: 4.4, h: 0.9, fontSize: 17, color: C.text1, margin: 0, valign: 'top', isTextBox: true, objectName: 'a1|stat 100 label' });
  s.addText('Under 1 µs', { x: 0.7, y: 4.3, w: 4.6, h: 0.95, fontSize: 44, bold: true, color: C.accent2, fontFace: 'Georgia', margin: 0, isTextBox: true, objectName: 'a3|stat check' });
  s.addText('for the safety check itself', { x: 0.7, y: 5.25, w: 4.4, h: 0.5, fontSize: 17, color: C.text1, margin: 0, isTextBox: true, objectName: 'a3|stat check label' });
  s.addChart(pres.charts.BAR, [{ name: 'Average time to stop (ms)', labels: ['Air bubble', 'Sensor goes silent', 'Blocked line', 'Free flow (waits 50 ms on purpose)'], values: [3.1, 4.4, 9.7, 51.8] }], {
    x: 5.6, y: 1.85, w: 7.0, h: 4.4, barDir: 'bar', chartColors: [X.accent1], barGapWidthPct: 60,
    showTitle: true, title: 'Average time to stop the pump, in milliseconds', titleColor: X.dk1, titleFontSize: 14, titleFontFace: '+mn-lt',
    showValue: true, dataLabelPosition: 'outEnd', dataLabelFormatCode: '0.0', dataLabelColor: X.dk1, dataLabelFontSize: 14, dataLabelFontFace: '+mn-lt',
    catAxisLabelColor: X.dk1, catAxisLabelFontSize: 13, catAxisLabelFontFace: '+mn-lt', valAxisLabelColor: X.accent5, valAxisLabelFontSize: 11, valAxisLabelFontFace: '+mn-lt',
    valGridLine: { color: 'E3ECEA', size: 0.75 }, catGridLine: { style: 'none' }, showLegend: false, objectName: 'a2|stop time chart',
  });
  source(s, 'Measured on QNX 8.0 in QEMU on a Mac. Real hardware should be faster. An empty bag raises an alarm instantly.');

  // ============ 12. Bugs found ============
  s = content('Proof', 'REAL ENGINEERING', 'Testing on QNX found three bugs. All fixed.');
  const bugs = [
    ['The monitor could be held up', 'Printing to the screen can block. It delayed safety by up to 12 ms.', 'Only a low-priority helper prints now.'],
    ['Two parts could freeze each other', 'On one CPU, the monitor waited for data that could never arrive.', 'The monitor never waits now.'],
    ['A bubble could slip past', 'A late check missed a bubble 4 times out of 5.', 'Air is now a running total. 20 of 20 caught.'],
  ];
  for (let i = 0; i < 3; i++) {
    const x = 0.7 + i * 4.05;
    tint(s, x, 1.95, 3.8, 4.35, X.lt2, `a${i + 1}|bug card ${i + 1}`);
    s.addText([
      { text: bugs[i][0], options: { bold: true, fontSize: 20, color: C.text1, fontFace: 'Georgia', breakLine: true } },
      { text: bugs[i][1], options: { fontSize: 16, color: C.accent5 } },
    ], { x: x + 0.35, y: 2.3, w: 3.1, h: 2.0, valign: 'top', margin: 0, paraSpaceAfter: 8, isTextBox: true, objectName: `a${i + 1}|bug ${i + 1} problem` });
    await circleIcon(s, x + 0.35, 4.55, 0.6, X.accent1, fa.FaCheck, `a${i + 1}|bug ${i + 1} fixed`);
    s.addText(bugs[i][2], { x: x + 1.1, y: 4.45, w: 2.4, h: 1.5, fontSize: 16, bold: true, color: C.text2, valign: 'top', margin: 0, isTextBox: true, objectName: `a${i + 1}|bug ${i + 1} fix` });
  }

  // ============ 13. Judging criteria ============
  pres.addSection({ title: 'Closing' });
  s = content('Closing', 'HOW IT ANSWERS THE CHALLENGE', 'Built to meet every judging point');
  const crit = [
    [fa.FaCogs, X.accent1, 'Technology', 'Timer pulses, real-time priorities, a resource manager and our own QNX boot image.'],
    [fa.FaPencilRuler, X.accent4, 'Design', 'A complete product: drug limits, a live device, a fault test bench, tests.'],
    [fa.FaHeartbeat, X.accent3, 'Impact', 'A real, documented danger in hospitals, in a market QNX already serves.'],
    [fa.FaLightbulb, X.accent2, 'Innovation', 'Safety as its own real-time guardian that anyone can test from a shell.'],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.7 + (i % 2) * 6.05, y = 1.95 + Math.floor(i / 2) * 2.2;
    await circleIcon(s, x, y, 0.85, crit[i][1], crit[i][0], `a${i + 1}|crit ${crit[i][2]}`);
    s.addText([
      { text: crit[i][2], options: { bold: true, fontSize: 21, color: C.text1, fontFace: 'Georgia', breakLine: true } },
      { text: crit[i][3], options: { fontSize: 16, color: C.text1 } },
    ], { x: x + 1.15, y: y - 0.05, w: 4.6, h: 1.8, valign: 'top', margin: 0, paraSpaceAfter: 6, isTextBox: true, objectName: `a${i + 1}|crit text ${crit[i][2]}` });
  }

  tint(s, 0.7, 5.75, 11.9, 0.85, X.accent6, 'a5|entry card');
  s.addText([
    { text: 'Entered in Robotics & Medical.  ', options: { bold: true, color: C.text2 } },
    { text: 'Also aiming for the Best Use of QNX-specific Technologies bonus.', options: { color: C.text2 } },
  ], { x: 1.0, y: 5.75, w: 11.4, h: 0.85, fontSize: 17, valign: 'middle', margin: 0, isTextBox: true, objectName: 'a5|entry text' });

  // ============ 14. Next and thanks ============
  s = pres.addSlide({ masterName: 'COVER', sectionTitle: 'Closing' });
  s.addImage({ data: img('photos/nurse.jpg'), x: 6.9, y: 0, w: 6.433, h: 7.5, sizing: { type: 'cover', w: 6.433, h: 7.5 }, objectName: 'a1|photo nurse at the pump', altText: 'A nurse setting up an infusion pump' });
  s.addText('WHAT COMES NEXT', { x: 0.8, y: 0.95, w: 5.8, h: 0.35, fontSize: 13, bold: true, color: C.accent2, charSpacing: 3, margin: 0, isTextBox: true, objectName: 'a1|next eyebrow' });
  s.addText([
    { text: 'Real pump hardware on a Raspberry Pi 4 with QNX', options: { bullet: true, breakLine: true } },
    { text: 'Monitor and pump as separate QNX processes', options: { bullet: true, breakLine: true } },
    { text: 'A signed drug library hospitals can update', options: { bullet: true, breakLine: true } },
    { text: 'A path toward medical safety certification', options: { bullet: true } },
  ], { x: 0.8, y: 1.5, w: 5.7, h: 2.6, fontSize: 18, color: C.background1, paraSpaceAfter: 10, margin: 0, valign: 'top', isTextBox: true, objectName: 'a2|next list' });
  s.addText('Thank you', { x: 0.8, y: 4.55, w: 5.8, h: 1.0, fontSize: 52, bold: true, color: C.background1, fontFace: 'Georgia', margin: 0, isTextBox: true, objectName: 'a3|thanks' });
  s.addText('Safety should never have to wait.', { x: 0.8, y: 5.5, w: 5.8, h: 0.5, fontSize: 20, italic: true, color: 'DDF2EE', fontFace: 'Georgia', margin: 0, isTextBox: true, objectName: 'a3|line' });
  s.addText('github.com/KushagraRishi/infusafe-qnx', { x: 0.8, y: 6.2, w: 5.8, h: 0.4, fontSize: 16, color: C.accent2, margin: 0, isTextBox: true, objectName: 'a3|repo', hyperlink: { url: 'https://github.com/KushagraRishi/infusafe-qnx' } });

  const out = path.join(__dirname, 'InfuSafe_v2.pptx');
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log('wrote', out);
})();
