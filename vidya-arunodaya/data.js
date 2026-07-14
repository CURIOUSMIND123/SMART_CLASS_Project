/* Vidya Arunodaya — offline curriculum manifest.
   Every asset is legally bundled:
   - PhET sims: CC BY 4.0 (redistribution allowed, attribution kept)
   - 3D models: royalty-free sample assets (viewer demo)
   - Notes: ORIGINAL text written for this pack (no NCERT text reproduced)
   - "Official chapter" links open ncert.nic.in / diksha.gov.in when online. */

const CURRICULUM = {
  "Class 10": {
    "Science": [
      {
        ch: 1, title: "Chemical Reactions and Equations", titleHi: "रासायनिक अभिक्रियाएँ",
        sim: "balancing-chemical-equations", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/jesc101.pdf",
        notes: "A chemical reaction rearranges atoms to form new substances. Atoms are never created or destroyed, so a chemical equation must be balanced — the same number of each atom on both sides. Explore this by balancing real equations in the simulation.",
        notesHi: "रासायनिक अभिक्रिया में परमाणु पुनर्व्यवस्थित होकर नए पदार्थ बनाते हैं। परमाणु न बनते हैं न नष्ट होते हैं, इसलिए समीकरण संतुलित होना चाहिए।",
        quiz: [
          { q: "Why must a chemical equation be balanced?", opts: ["To look neat", "Atoms are conserved — not created or destroyed", "To use less paper"], a: 1 },
          { q: "In 2H₂ + O₂ → 2H₂O, how many oxygen atoms are on the left?", opts: ["1", "2", "4"], a: 1 },
        ],
      },
      {
        ch: 4, title: "Carbon and its Compounds — Atomic Structure", titleHi: "परमाणु की संरचना",
        sim: "build-an-atom", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/jesc104.pdf",
        notes: "Everything is made of atoms: a nucleus of protons and neutrons, with electrons around it. The number of protons decides which element it is. Build atoms yourself and watch the element change.",
        notesHi: "प्रत्येक वस्तु परमाणुओं से बनी है — प्रोटॉन और न्यूट्रॉन का नाभिक तथा चारों ओर इलेक्ट्रॉन। प्रोटॉनों की संख्या तत्व तय करती है।",
        quiz: [
          { q: "What decides which element an atom is?", opts: ["Number of neutrons", "Number of protons", "Its colour"], a: 1 },
          { q: "Where are electrons found?", opts: ["In the nucleus", "Around the nucleus", "Outside the atom entirely"], a: 1 },
        ],
      },
      {
        ch: 10, title: "Light — Reflection and Refraction", titleHi: "प्रकाश — परावर्तन और अपवर्तन",
        sim: "geometric-optics-basics", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/jesc110.pdf",
        notes: "Light bends (refracts) when it passes from one medium to another, and lenses use this to form images. Move the object and the lens and watch where the image forms.",
        notesHi: "प्रकाश एक माध्यम से दूसरे में जाने पर मुड़ता है (अपवर्तन), और लेंस इससे प्रतिबिंब बनाते हैं।",
        quiz: [
          { q: "A convex lens converges light to form an image at its…", opts: ["Focus", "Edge", "Centre only"], a: 0 },
          { q: "Bending of light entering a new medium is called…", opts: ["Reflection", "Refraction", "Rotation"], a: 1 },
        ],
      },
      {
        ch: 11, title: "The Human Eye and the Colourful World", titleHi: "मानव नेत्र और रंगबिरंगा संसार",
        lesson: "lessons/eye-class10.html", sim: null, model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/jesc111.pdf",
        original: true,
        notes: "OUR ORIGINAL interactive 3D lesson: rotate a cut-away eye, click each part, explore accommodation, vision defects, prism dispersion and why the sky is blue. This is the kind of original content we build for Arunachal.",
        notesHi: "हमारा मौलिक इंटरैक्टिव 3D पाठ — नेत्र के भागों को घुमाकर देखें और समझें।",
        quiz: [
          { q: "Where is the image formed in a healthy eye?", opts: ["On the cornea", "On the retina", "On the iris"], a: 1 },
          { q: "The sky looks blue because of…", opts: ["Blue oceans", "Scattering of light", "Blue air"], a: 1 },
        ],
      },
      {
        ch: 12, title: "Electricity", titleHi: "विद्युत",
        sim: "circuit-construction-kit-dc", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/jesc112.pdf",
        notes: "An electric current flows when charges move through a closed circuit. Build circuits with batteries, bulbs, wires and switches, and see current, voltage and resistance in action.",
        notesHi: "बंद परिपथ में आवेश गति करने पर विद्युत धारा बहती है। बैटरी, बल्ब, तार और स्विच से परिपथ बनाइए।",
        quiz: [
          { q: "Current flows only when the circuit is…", opts: ["Open", "Closed", "Broken"], a: 1 },
          { q: "A device that breaks or completes a circuit is a…", opts: ["Switch", "Battery", "Bulb"], a: 0 },
        ],
      },
    ],
    "Mathematics": [
      {
        ch: 8, title: "Introduction to Trigonometry — Angles & Waves", titleHi: "त्रिकोणमिति",
        sim: "wave-on-a-string", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/jemh108.pdf",
        notes: "Trigonometry describes repeating, wave-like patterns. A vibrating string shows how amplitude and frequency shape a wave — the same sine curve behind trigonometry.",
        notesHi: "त्रिकोणमिति दोहराने वाले तरंग-पैटर्न का वर्णन करती है।",
        quiz: [{ q: "The height of a wave is its…", opts: ["Amplitude", "Speed", "Colour"], a: 0 }],
      },
    ],
  },
  "Class 9": {
    "Science": [
      {
        ch: 1, title: "Matter in Our Surroundings", titleHi: "हमारे आस-पास के पदार्थ",
        sim: "states-of-matter-basics", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/iesc101.pdf",
        notes: "Matter exists as solid, liquid or gas depending on how much its particles move. Add or remove heat in the simulation and watch matter change state.",
        notesHi: "पदार्थ ठोस, द्रव या गैस के रूप में होता है, जो कणों की गति पर निर्भर करता है।",
        quiz: [
          { q: "Heating a solid enough turns it into a…", opts: ["Gas directly always", "Liquid", "New element"], a: 1 },
          { q: "Particles move fastest in a…", opts: ["Solid", "Liquid", "Gas"], a: 2 },
        ],
      },
      {
        ch: 10, title: "Gravitation", titleHi: "गुरुत्वाकर्षण",
        sim: "gravity-and-orbits", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/iesc110.pdf",
        notes: "Every mass pulls every other mass. Gravity keeps planets in orbit around the Sun and the Moon around Earth. Turn gravity on and off and watch orbits form or break.",
        notesHi: "प्रत्येक द्रव्यमान दूसरे को खींचता है। गुरुत्वाकर्षण ग्रहों को सूर्य के चारों ओर बनाए रखता है।",
        quiz: [
          { q: "What keeps planets orbiting the Sun?", opts: ["Wind", "Gravity", "Magnetism"], a: 1 },
          { q: "Gravity between two objects depends on their…", opts: ["Colour", "Mass", "Age"], a: 1 },
        ],
      },
      {
        ch: 12, title: "Sound", titleHi: "ध्वनि",
        sim: "wave-on-a-string", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/iesc112.pdf",
        notes: "Sound travels as a wave. Shake one end of a string and a wave carries energy along it — just as vibrations carry sound through air.",
        notesHi: "ध्वनि तरंग के रूप में चलती है। तरंग ऊर्जा को आगे ले जाती है।",
        quiz: [{ q: "Sound travels as a…", opts: ["Wave", "Solid", "Light ray"], a: 0 }],
      },
    ],
  },
  "Class 6": {
    "Science": [
      {
        ch: 1, title: "Planet Earth — Our Home in Space", titleHi: "हमारी पृथ्वी — अंतरिक्ष में हमारा घर",
        lesson: "lessons/earth-3d.html", sim: null, model: null, original: true,
        ncert: "https://ncert.nic.in/textbook/pdf/fess1dd.pdf",
        notes: "OUR ORIGINAL flagship 3D lesson: a photoreal, rotatable Earth with real clouds, atmosphere and terrain, an orbiting Moon and a starfield. Tap the glowing pins — including Arunachal Pradesh — to learn about the equator, the poles, day and night, and the Moon.",
        notesHi: "हमारा मौलिक 3D पाठ: वास्तविक बादलों, वायुमंडल और चंद्रमा के साथ घूमती हुई पृथ्वी। अरुणाचल प्रदेश सहित चमकते बिंदुओं पर टैप करें।",
        quiz: [
          { q: "Why does Arunachal Pradesh see the sunrise first in India?", opts: ["It is the easternmost", "It is the tallest", "It is the coldest"], a: 0 },
          { q: "Day and night are caused by the Earth's…", opts: ["Rotation on its axis", "Distance from the Moon", "Clouds"], a: 0 },
        ],
      },
    ],
  },
  "Class 7": {
    "Mathematics": [
      {
        ch: 2, title: "Fractions and Decimals", titleHi: "भिन्न और दशमलव",
        sim: "fraction-matcher", model: null,
        ncert: "https://ncert.nic.in/textbook/pdf/gemh102.pdf",
        notes: "A fraction is a part of a whole. Match shapes and numbers to build an intuition for equal fractions — ½ = 2/4 = 3/6.",
        notesHi: "भिन्न किसी वस्तु का एक भाग है। समान भिन्नों को मिलाइए।",
        quiz: [{ q: "Which is equal to ½?", opts: ["2/4", "1/3", "3/5"], a: 0 }],
      },
    ],
    "Science": [
      {
        ch: 1, title: "Nutrition in Plants (PlantVerse)", titleHi: "पौधों में पोषण",
        lesson: "lessons/plantverse.html", sim: null, model: null, original: true,
        ncert: "https://ncert.nic.in/textbook/pdf/gesc101.pdf",
        notes: "OUR ORIGINAL interactive lesson: toggle sunlight, water and CO₂ and watch photosynthesis happen; explore stomata and how water and food travel in a plant.",
        notesHi: "हमारा मौलिक इंटरैक्टिव पाठ — प्रकाश-संश्लेषण को समझें।",
        quiz: [{ q: "Plants need which three things to make food?", opts: ["Sunlight, water, CO₂", "Soil, salt, wind", "Only water"], a: 0 }],
      },
    ],
  },
  "3D Model Lab": {
    "Interactive 3D": [
      {
        ch: 1, title: "Planet Earth — photoreal 3D (flagship)", titleHi: "पृथ्वी — फ़ोटोरियल 3D",
        lesson: "lessons/earth-3d.html", sim: null, model: null, original: true,
        notes: "OUR flagship original 3D lesson — photoreal rotating Earth, clouds, atmosphere, orbiting Moon and clickable locations. This is the world-class standard we build original content to; it runs fully offline.",
        notesHi: "हमारा प्रमुख मौलिक 3D पाठ — घूमती पृथ्वी, बादल, वायुमंडल और चंद्रमा।",
        quiz: [],
      },
      {
        ch: 2, title: "Animated human figure — 3D viewer", titleHi: "मानव आकृति — 3D",
        model: "lessons/model3d-human.html", sim: null, sampleModel: true,
        notes: "Drag to rotate, scroll or pinch to zoom, watch the animation — the viewer runs fully offline from the board's storage. In the deployed library, real CBSE 3D models (organs, machines, molecules) plug into this same viewer.",
        notesHi: "इस 3D मॉडल को घुमाएँ और ज़ूम करें — पूरी तरह ऑफ़लाइन।",
        quiz: [],
      },
      {
        ch: 3, title: "Original 3D lesson — The Human Eye", titleHi: "मानव नेत्र — मौलिक 3D पाठ",
        lesson: "lessons/eye-class10.html", sim: null, model: null, original: true,
        notes: "OUR ORIGINAL 3D lesson reused here to show the difference between a plain model viewer and a full built lesson: a rotatable eye, clickable parts, and five interactive rooms — the standard we build original content to.",
        notesHi: "हमारा मौलिक 3D पाठ — नेत्र के भागों को घुमाकर देखें।",
        quiz: [],
      },
    ],
  },
};

// UI strings incl. a local-language (Nyishi) sample to show localisation capability
const I18N = {
  en: { explore: "Explore", read: "Read", model3d: "3D Model", quiz: "Quiz", official: "Open official NCERT chapter", pick: "Pick a class to begin", offline: "Works 100% offline", lang: "English" },
  hi: { explore: "प्रयोग करें", read: "पढ़ें", model3d: "3D मॉडल", quiz: "प्रश्नोत्तरी", official: "आधिकारिक NCERT अध्याय खोलें", pick: "आरंभ करने के लिए कक्षा चुनें", offline: "पूर्णतः ऑफ़लाइन चलता है", lang: "हिंदी" },
  // Nyishi (Arunachal) — indicative sample localisation of the shell
  nyi: { explore: "Ka-tola", read: "Lung-nam", model3d: "3D Model", quiz: "Ali-nam", official: "NCERT chapter open toku", pick: "Class ka nyi-nam", offline: "Internet ma-do bo chal-la", lang: "Nyishi (नमूना)" },
};
