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


  const bullets = (items, o = {}) => items.map((t, i) => ({ text: t, options: { bullet: { indent: 20 }, breakLine: i < items.length - 1, ...(o.run || {}) } }));
  const blist = (s, items, x, y, w, h, name, size = 19, color = C.text1) =>
    s.addText(bullets(items), { x, y, w, h, fontSize: size, color, paraSpaceAfter: 10, valign: 'top', margin: 0, isTextBox: true, objectName: name });
  const loop = (s, f, x, y, w, h, name) => s.addImage({ path: A('loops/' + f), x, y, w, h, shadow: shadow(), objectName: name, altText: name.split('|')[1] || name });
  const tag = (s, text, x, y, w, color, name) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h: 0.42, rectRadius: 0.21, fill: { color: color || X.accent6 }, line: { color: color || X.accent6, width: 0 }, objectName: name + ' bg' });
    s.addText(text, { x, y, w, h: 0.42, fontSize: 13, bold: true, color: C.text2, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: name });
  };
  const tile = (s, k, f, x, num, head, items, color) => {
    loop(s, f, x, 1.9, 3.85, 2.166, `a${k}|real footage ${head}`);
    s.addShape(pres.shapes.OVAL, { x, y: 4.3, w: 0.5, h: 0.5, fill: { color }, line: { color, width: 0 }, objectName: `a${k}|num ${num}` });
    s.addText(String(num), { x, y: 4.3, w: 0.5, h: 0.5, fontSize: 15, bold: true, color: C.background1, align: 'center', valign: 'middle', margin: 0, isTextBox: true, objectName: `a${k}|num text ${num}` });
    s.addText(head, { x: x + 0.65, y: 4.3, w: 3.2, h: 0.5, fontSize: 19, bold: true, color: C.text1, fontFace: 'Georgia', valign: 'middle', margin: 0, isTextBox: true, objectName: `a${k}|head ${head}` });
    s.addText(bullets(items), { x, y: 4.95, w: 3.85, h: 1.4, fontSize: 15, color: C.text1, paraSpaceAfter: 6, valign: 'top', margin: 0, isTextBox: true, objectName: `a${k}|bullets ${head}` });
  };

  // ============ 2. Why we built this ============
  pres.addSection({ title: 'Why' });
  s = content('Why', 'WHY WE BUILT THIS', 'Safety is our first priority');
  blist(s, [
    'Chemo is strong medicine. A small mistake can hurt a patient fast.',
    'Pumps already have alarms. But an alarm only helps if it runs on time.',
    'So we built a safety check that is always on time, every single millisecond.',
  ], 0.7, 2.0, 5.9, 3.4, 'a1|why bullets', 21);
  tag(s, 'Robotics & Medical  ·  real-time, safety-critical', 0.7, 5.75, 5.2, X.accent6, 'a2|track tag');
  photo(s, 'photos/hand.jpg', 7.1, 1.95, 5.5, 3.094, 'a2|photo IV line in a patient arm');
  s.addText('Every infusion ends here: a thin line into a vein.', { x: 7.1, y: 5.2, w: 5.5, h: 0.5, fontSize: 15, italic: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a3|photo caption' });

  // ============ 3. How it works today ============
  pres.addSection({ title: 'The problem' });
  s = content('The problem', 'THE BASICS', 'How a chemo infusion works');
  tile(s, 1, 'drip.gif', 0.7, 1, 'The drug drips', ['It hangs in a bag above the patient.', 'A drip chamber shows it moving.'], X.accent1);
  tile(s, 2, 'pump.gif', 4.725, 2, 'The pump sets the speed', ['A nurse types the rate.', 'The motor pushes the drug.'], X.accent1);
  tile(s, 3, 'vein.gif', 8.75, 3, 'It enters the vein', ['A thin tube runs to the arm.', 'This can go on for hours or days.'], X.accent1);

  // ============ 4. Three ways it goes wrong ============
  s = content('The problem', 'THE PROBLEM', 'Three ways it can go wrong');
  tile(s, 1, 'kink.gif', 0.7, 1, 'A kinked tube', ['The drug stops flowing.', 'Pressure builds up in the line.'], X.accent3);
  tile(s, 2, 'air.gif', 4.725, 2, 'Air in the line', ['A bubble moves down the tube.', 'It heads toward the vein.'], X.accent3);
  tile(s, 3, 'typo.gif', 8.75, 3, 'A wrong number', ['500 typed instead of 50.', 'That is ten times the dose.'], X.accent3);

  // ============ 5. Real case ============
  s = content('The problem', 'IT REALLY HAPPENS', 'One wrong setting turned 46 hours into 2');
  s.addText('Planned', { x: 0.7, y: 1.95, w: 2.2, h: 0.4, fontSize: 16, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a1|planned label' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 2.4, w: 9.6, h: 0.7, rectRadius: 0.2, fill: { color: X.accent1 }, line: { color: X.accent1, width: 0 }, objectName: 'a1|planned bar' });
  s.addText('46 hours', { x: 10.5, y: 2.35, w: 2.2, h: 0.8, fontSize: 32, bold: true, color: C.accent1, fontFace: 'Georgia', margin: 0, valign: 'middle', isTextBox: true, objectName: 'a1|planned value' });
  s.addText('What the pump delivered', { x: 0.7, y: 3.4, w: 5, h: 0.4, fontSize: 16, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a2|actual label' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 3.85, w: 0.42, h: 0.7, rectRadius: 0.2, fill: { color: X.accent3 }, line: { color: X.accent3, width: 0 }, objectName: 'a2|actual bar' });
  s.addText('about 2 hours', { x: 1.35, y: 3.8, w: 4, h: 0.8, fontSize: 32, bold: true, color: C.accent3, fontFace: 'Georgia', margin: 0, valign: 'middle', isTextBox: true, objectName: 'a2|actual value' });
  blist(s, ['4,500 mg of the chemo drug fluorouracil, meant for two days', 'The pump was set up wrong, so it all went in within about two hours', 'The patient had to be admitted to hospital'], 0.7, 4.9, 11.9, 1.5, 'a3|story bullets', 18);
  source(s, 'Source: ISMP Medication Safety Alert!, June 18, 2015, "Accidental overdoses involving fluorouracil infusions"');

  // ============ 6. How often ============
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
  s.addText(bullets(['2024: an FDA Class I recall', 'A software bug in air detection could let a 1 mL air bubble reach the patient. Two people were injured.']), { x: 2.0, y: 4.75, w: 10.3, h: 1.3, fontSize: 17, color: C.text1, paraSpaceAfter: 4, margin: 0, valign: 'middle', isTextBox: true, objectName: 'a4|recent text' });
  source(s, 'Sources: FDA Infusion Pump Improvement Initiative (2010); FDA recall notice for Z-800 series pumps (2024)');

  // ============ 7. The gap ============
  s = content('The problem', 'THE GAP', 'A safety check only helps if it runs on time');
  blist(s, ['In many systems, one program runs the screen, the buttons, the motor and the alarms', 'When it gets busy, the safety check waits in line', 'I measured it on a normal Linux setup:'], 0.7, 1.9, 11.9, 1.6, 'a1|gap bullets', 18);
  s.addText('Planned: a check every 1 ms', { x: 0.7, y: 3.55, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a2|planned label' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 4.0, w: 0.16, h: 0.55, rectRadius: 0.06, fill: { color: X.accent1 }, line: { color: X.accent1, width: 0 }, objectName: 'a2|planned bar' });
  s.addText('1 ms', { x: 1.0, y: 3.95, w: 2, h: 0.65, fontSize: 26, bold: true, color: C.accent1, fontFace: 'Georgia', margin: 0, valign: 'middle', isTextBox: true, objectName: 'a2|planned value' });
  s.addText('Worst delay I saw', { x: 0.7, y: 4.8, w: 6, h: 0.4, fontSize: 16, bold: true, color: C.accent5, margin: 0, isTextBox: true, objectName: 'a3|delay label' });
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 0.7, y: 5.25, w: 10.4, h: 0.55, rectRadius: 0.2, fill: { color: X.accent3 }, line: { color: X.accent3, width: 0 }, objectName: 'a3|delay bar' });
  s.addText('65 ms', { x: 11.3, y: 5.2, w: 1.4, h: 0.65, fontSize: 26, bold: true, color: C.accent3, fontFace: 'Georgia', margin: 0, valign: 'middle', isTextBox: true, objectName: 'a3|delay value' });
  s.addText('65 times late. The check was right, but it came too late.', { x: 0.7, y: 6.05, w: 11.9, h: 0.45, fontSize: 18, bold: true, color: C.text2, margin: 0, isTextBox: true, objectName: 'a4|takeaway' });

  // ============ 8. Our solution: how it works ============
  pres.addSection({ title: 'The solution' });
  s = content('The solution', 'OUR SOLUTION', 'InfuSafe: a safety check that is never late');
  const box = (k, x, y, w, h, fill, head, sub, name, dark) => {
    s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x, y, w, h, rectRadius: 0.18, fill: { color: fill }, line: { color: fill, width: 0 }, shadow: shadow(), objectName: `a${k}|${name} box` });
    s.addText([{ text: head, options: { bold: true, fontSize: 17, breakLine: true } }, { text: sub, options: { fontSize: 13 } }], { x: x + 0.15, y, w: w - 0.3, h, align: 'center', valign: 'middle', color: dark ? X.lt1 : X.dk1, margin: 0, isTextBox: true, objectName: `a${k}|${name} text` });
  };
  const arrowLine = (k, x1, y1, x2, y2, name, color) => s.addShape(pres.shapes.LINE, { x: Math.min(x1, x2), y: Math.min(y1, y2), w: Math.abs(x2 - x1) || 0.001, h: Math.abs(y2 - y1) || 0.001, flipV: y2 < y1, line: { color: color || X.accent5, width: 2.5, endArrowType: 'triangle' }, objectName: `a${k}|${name}` });
  box(1, 0.7, 2.95, 2.9, 1.25, X.lt2, 'Pump sensors', 'flow · pressure · air', 'sensors');
  box(2, 4.55, 2.6, 3.6, 1.95, X.dk2, 'InfuSafe on QNX', 'checks every 1 ms · priority 50', 'monitor', true);
  box(1, 4.95, 1.85, 2.8, 0.55, 'FFF3DD', 'Drug library', '', 'library');
  box(3, 9.1, 2.35, 3.5, 0.95, 'FDE7E3', 'Stop the motor', 'in milliseconds', 'stop');
  box(3, 9.1, 3.85, 3.5, 0.95, 'FFF3DD', 'Sound the alarm', 'empty bag, soft limit', 'alarm');
  arrowLine(2, 3.6, 3.575, 4.55, 3.575, 'arrow sensors');
  arrowLine(2, 6.35, 2.4, 6.35, 2.6, 'arrow library');
  arrowLine(3, 8.15, 3.3, 9.1, 2.83, 'arrow stop', X.accent3);
  arrowLine(3, 8.15, 3.85, 9.1, 4.32, 'arrow alarm', X.accent2);
  blist(s, ['Sits beside the pump, separate from the screen and buttons', 'Blocks unsafe doses before the pump even starts'], 0.7, 5.05, 5.9, 1.4, 'a4|solution bullets left', 17);
  blist(s, ['Stops the pump in milliseconds when something goes wrong', 'Easy to test from any shell: /dev/infusafe'], 6.9, 5.05, 5.7, 1.4, 'a4|solution bullets right', 17);

  // ============ 9. See it catch a fault ============
  s = content('The solution', 'LIVE ON QNX 8.0', 'Watch it catch a blocked line');
  loop(s, 'qnx_block.gif', 0.7, 1.9, 6.4, 3.688, 'a1|real QNX terminal catching a blocked line');
  blist(s, ['QNX 8.0 boots from our own system image', 'A rate of 500 is refused before the pump starts', 'At 50, the pump starts safely', 'We block the line: stopped in 9 ms', 'We add an air bubble: stopped in 3 ms'], 7.55, 1.95, 5.05, 3.6, 'a2|demo bullets', 18);
  tag(s, 'Real QNX output, not a mockup', 7.55, 5.75, 3.6, X.accent6, 'a3|real tag');

  // ============ 10. Who it helps ============
  s = content('The solution', 'WHO IT HELPS', 'More safety for everyone around the infusion');
  const helps = [
    [fa.FaUserInjured, X.accent3, 'Patients', ['Overdoses stopped before they start', 'Air and blocked lines stopped in ms']],
    [fa.FaUserNurse, X.accent1, 'Nurses', ['A second check on every number typed', 'Clear status, easy to see']],
    [fa.FaHospital, X.accent4, 'Hospitals', ['An extra safety layer on every pump', 'One drug library for all pumps']],
    [fa.FaIndustry, X.accent2, 'Pump makers', ['A ready, open-source safety layer', 'Built on QNX, made for medical devices']],
  ];
  for (let i = 0; i < 4; i++) {
    const x = 0.7 + i * 3.02;
    tint(s, x, 1.95, 2.8, 4.3, X.lt2, `a${i + 1}|help card ${helps[i][2]}`);
    await circleIcon(s, x + 0.35, 2.3, 0.85, helps[i][1], helps[i][0], `a${i + 1}|help ${helps[i][2]}`);
    s.addText(helps[i][2], { x: x + 0.35, y: 3.35, w: 2.2, h: 0.5, fontSize: 21, bold: true, color: C.text1, fontFace: 'Georgia', margin: 0, isTextBox: true, objectName: `a${i + 1}|help head ${helps[i][2]}` });
    s.addText(bullets(helps[i][3]), { x: x + 0.35, y: 3.95, w: 2.25, h: 2.1, fontSize: 15, color: C.text1, paraSpaceAfter: 8, valign: 'top', margin: 0, isTextBox: true, objectName: `a${i + 1}|help bullets ${helps[i][2]}` });
  }

  // ============ 11. Built to scale ============
  s = content('The solution', 'BUILT TO SCALE', 'One safety layer for every pump');
  tint(s, 0.7, 1.95, 4.4, 4.3, X.dk2, 'a1|scale stat card');
  s.addText('9 in 10', { x: 1.05, y: 2.3, w: 3.8, h: 1.2, fontSize: 60, bold: true, color: C.accent2, fontFace: 'Georgia', margin: 0, isTextBox: true, objectName: 'a1|stat 9 in 10' });
  s.addText('hospital patients get medicine through an IV, and most of it runs through pumps.', { x: 1.05, y: 3.6, w: 3.7, h: 1.6, fontSize: 18, color: C.background1, margin: 0, valign: 'top', isTextBox: true, objectName: 'a1|stat label' });
  s.addText('Source: BMJ Quality & Safety', { x: 1.05, y: 5.6, w: 3.7, h: 0.3, fontSize: 11, color: 'BFD9D5', margin: 0, isTextBox: true, objectName: 'a1|stat source' });
  blist(s, [
    'Software only: it can be added to any pump with flow, pressure and air sensors',
    'Tiny cost: the check uses about 0.1% of one processor',
    'Runs on QNX on Intel and ARM chips, from big systems to small boards',
    'One drug library can protect every pump in a hospital',
    'Open source, with a fault test bench any pump maker can run',
  ], 5.6, 1.95, 7.0, 4.4, 'a2|scale bullets', 18);

  // ============ 12. Why QNX ============
  s = content('The solution', 'WHY QNX', 'Real-time QNX makes safety arrive on time');
  blist(s, ['Safety always goes first: priority 50, logs at 5', 'The QNX kernel wakes the monitor every 1 ms'], 0.7, 1.9, 5.9, 1.3, 'a1|qnx bullets left', 18);
  blist(s, ['The microkernel keeps one fault from spreading', 'QNX already serves medical device makers'], 6.9, 1.9, 5.7, 1.3, 'a1|qnx bullets right', 18);
  s.addImage({ path: A('code/rt_code.png'), x: 0.7, y: 3.35, w: 8.9, h: 3.311, shadow: shadow(), objectName: 'a2|real QNX code from src/rt.c', altText: 'Real QNX code from src/rt.c' });
  s.addText(bullets(['A QNX resource manager: src/control.c', 'Our own boot image: qnx/infusafe.build', '30 tests pass on QNX 8.0']), { x: 9.95, y: 3.45, w: 2.7, h: 3.0, fontSize: 15, color: C.text1, paraSpaceAfter: 10, margin: 0, valign: 'top', isTextBox: true, objectName: 'a3|code note' });

  // ============ 11. Results ============
  pres.addSection({ title: 'Proof' });
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

  const out = path.join(__dirname, 'InfuSafe_v3.pptx');
  await pres.writeFile({ fileName: out });
  await applyTheme(out, THEME);
  console.log('wrote', out);
})();
