/*
  The Starfall Expedition: story, puzzles and route layout.

  You can edit any text, question or answer in this file.
  Line format:  ['z', 'text']  Zib speaks
                ['g', 'text']  Captain Gloop speaks
                ['n', 'text']  narrator
                ['sys', 'text'] scanner/system message
  Text tokens:  {lead} = the Ranger whose turn it is, {names} = all Rangers,
                {letters} = shard letters collected so far.

  Challenge types:
    quiz   -> options: [...], answer: index of the right option
    text   -> accept: [...] list of accepted answers (case and spaces ignored)
    number -> answer: the number
  Each challenge has easy / medium / hard versions. Rangers get the version
  that matches their level, set on the team screen.
*/
window.STARFALL = {
  title: 'The Starfall Expedition',
  launchCode: 'COMET',

  // Physical checkpoints the grown-up places on the map, in setup order.
  pins: [
    { id: 'base',   label: 'Base Camp',             where: 'Start (usually home)' },
    { id: 'n1',     label: 'The Crash Site',        where: 'Stop 1 (everyone)' },
    { id: 'a2',     label: 'The Signal Tower',      where: 'Glowing Trail, stop 2', path: 'glow' },
    { id: 'a3',     label: 'The Echo Garden',       where: 'Glowing Trail, stop 3', path: 'glow' },
    { id: 'b2',     label: "Gloop's Footprints",    where: 'Slime Trail, stop 2',   path: 'slime' },
    { id: 'b3',     label: "The Pirate's Hideout",  where: 'Slime Trail, stop 3',   path: 'slime' },
    { id: 'n4',     label: 'The Crossroads of Stars', where: 'Stop 4 (both trails meet)' },
    { id: 'c5',     label: "The Comet's Tail",      where: 'Comet Path, stop 5',    path: 'comet' },
    { id: 'd5',     label: 'The Moonlit Hollow',    where: 'Moon Path, stop 5',     path: 'moon' },
    { id: 'finale', label: 'The Launch Pad',        where: 'Finish (can be Base Camp)' }
  ],

  // Walking legs between checkpoints, for the setup map and distance checks.
  legs: [
    ['base', 'n1', 'main'],
    ['n1', 'a2', 'glow'], ['a2', 'a3', 'glow'], ['a3', 'n4', 'glow'],
    ['n1', 'b2', 'slime'], ['b2', 'b3', 'slime'], ['b3', 'n4', 'slime'],
    ['n4', 'c5', 'comet'], ['c5', 'finale', 'comet'],
    ['n4', 'd5', 'moon'], ['d5', 'finale', 'moon']
  ],

  routes: [
    { name: 'Glowing Trail + Comet Path', stops: ['base', 'n1', 'a2', 'a3', 'n4', 'c5', 'finale'] },
    { name: 'Glowing Trail + Moon Path',  stops: ['base', 'n1', 'a2', 'a3', 'n4', 'd5', 'finale'] },
    { name: 'Slime Trail + Comet Path',   stops: ['base', 'n1', 'b2', 'b3', 'n4', 'c5', 'finale'] },
    { name: 'Slime Trail + Moon Path',    stops: ['base', 'n1', 'b2', 'b3', 'n4', 'd5', 'finale'] }
  ],

  ranks: [
    { min: 0.85, title: 'Galactic Legends', line: 'Glimmerwick will be telling stories about you for a thousand years.' },
    { min: 0.65, title: 'Star Rangers, First Class', line: 'Clever, careful and kind. Zib could not have asked for a better crew.' },
    { min: 0.40, title: 'Star Rangers', line: 'You got the Pebble home. That makes you real Star Rangers.' },
    { min: 0,    title: 'Space Cadets', line: 'Every legend starts as a cadet. Zib is very proud of you.' }
  ],

  rules: [
    ['Stay with your Commander', 'Your grown-up is Mission Commander. Always stay where they can see you.'],
    ['Stop at every kerb', 'Stop, look and listen. Only cross a road with the Commander.'],
    ['Eyes up while walking', 'Read, scan and solve puzzles only when you are standing still.'],
    ['Shards are always somewhere safe', 'Never in a road, a garden or anywhere you are not allowed to go. Stay on pavements and paths.']
  ],

  nodes: {
    base: {
      place: 'Base Camp',
      intro: [
        ['sys', 'Incoming transmission. Signal source: deep space.'],
        ['z', 'Bzzzt! Hello? Is this thing on? Oh, wonderful! Earthlings!'],
        ['z', 'My name is Zib. I am a pilot from the planet Glimmerwick, and I have had a very bad night.'],
        ['z', 'A space storm knocked my starship, the Pebble, right out of the sky. I crash-landed somewhere near your house.'],
        ['z', 'Worse, my Star Engine burst into five glowing star shards, and they scattered all over your neighbourhood. Without them I can never get home.'],
        ['z', 'And there is one more problem. Captain Gloop, the gooiest pirate in the galaxy, followed me here. He wants my shards.'],
        ['z', 'I need a crew. Brave, clever, careful Earthlings. {names}, will you be my Star Rangers?']
      ],
      training: [
        ['z', 'First, scanner training. I have hidden a practice shard right here at Base Camp.'],
        ['z', 'Hold the phone up like a window. Turn slowly all the way round until you spot the glowing crystal, then tap it!']
      ],
      trainingDone: [
        ['z', 'Brilliant! You are naturals.'],
        ['z', 'Every real shard has a glowing letter inside it. Collect all five and you will have the launch code for the Pebble.']
      ],
      sendoff: [
        ['z', 'My scanner just picked up the first real signal. It is coming from where the Pebble first scraped the ground.'],
        ['z', 'Commander, lead the way. Rangers, eyes up and walk safely!']
      ],
      next: 'n1'
    },

    n1: {
      place: 'The Crash Site',
      letter: 'T',
      target: 'shard',
      arrive: [
        ['z', 'Bzzt! The scanner is going wild! This is where the Pebble scraped the ground on the way down.'],
        ['z', 'Can you smell that? Scorched space-toast. My lunch went flying in the crash.'],
        ['z', 'A shard is very close. Scanners up, Rangers!']
      ],
      caught: [
        ['z', 'Shard number one! It glows with the letter T. Keep it safe.'],
        ['z', 'Before we go on, the Pebble computer needs a safety check. It only opens for clever Earthlings.']
      ],
      challenge: {
        easy:   { type: 'quiz', kind: 'Space quiz', q: 'What is the big, bright star we see in the sky during the day?',
                  options: ['The Sun', 'The Moon', 'Mars', 'A comet'], answer: 0,
                  hint: 'It makes the daytime warm and bright.',
                  explain: 'The Sun is a star! It is the closest star to Earth.' },
        medium: { type: 'quiz', kind: 'Space quiz', q: 'Which planet is closest to the Sun?',
                  options: ['Venus', 'Mercury', 'Mars', 'Earth'], answer: 1,
                  hint: 'It is the smallest planet, named after a speedy messenger.',
                  explain: 'Mercury zooms round the Sun in just 88 days.' },
        hard:   { type: 'quiz', kind: 'Space quiz', q: 'Light from the Sun takes about how long to reach Earth?',
                  options: ['8 seconds', '8 minutes', '8 hours', '8 days'], answer: 1,
                  hint: 'Longer than a sneeze, shorter than a film.',
                  explain: 'About 8 minutes and 20 seconds. The sunlight on your face left the Sun before you started this puzzle!' }
      },
      field: { type: 'photo', title: 'Repair log',
               text: 'Zib needs spare parts! Find something made of metal that you can see from the path: a lamp post, a gate, a drain cover or a postbox. Snap a photo for the repair log.' },
      outro: [
        ['z', 'Hmm. The scanner is showing TWO trails from here.'],
        ['z', 'One is a bright GLOWING TRAIL. That is a strong shard signal, but it is wrapped in Glimmerwick codes.'],
        ['z', 'The other is a SLIME TRAIL. Sticky. Purple. Smelly. Captain Gloop went that way, and I think he has found a shard.']
      ],
      choice: {
        fork: 'trail',
        prompt: 'Which trail will you follow?',
        options: [
          { key: 'glow', title: 'The Glowing Trail', to: 'a2',
            desc: 'Crack secret Glimmerwick codes. Puzzles are worth 50% more points.',
            sendoff: [['z', 'To the Glowing Trail! The signal is strong. Follow the arrow, and eyes up while you walk.']] },
          { key: 'slime', title: 'The Slime Trail', to: 'b2',
            desc: 'Track Captain Gloop like detectives. Spotting missions are worth 50% more points.',
            sendoff: [['z', 'Follow that slime! Quietly now. Pirates have very good ears. Actually, Gloop has no ears. But still.']] }
        ]
      }
    },

    a2: {
      place: 'The Signal Tower',
      letter: 'O',
      target: 'shard',
      challengeMult: 1.5,
      arrive: [
        ['z', 'Look up, Rangers! Anything tall near you, a lamp post, a tree or a chimney, is acting like an antenna.'],
        ['z', 'The shard signal is bouncing off it. The shard must be hiding right here!']
      ],
      caught: [
        ['z', 'Shard two! This one glows with the letter O.'],
        ['z', 'Uh-oh. The shard sent us a message, but it is scrambled in Glimmerwick code.']
      ],
      challenge: {
        easy:   { type: 'text', kind: 'Word scramble', q: 'Unscramble these letters to find the hot star in our sky.',
                  visual: 'N U S', accept: ['sun'],
                  hint: 'It comes up in the morning.', explain: 'SUN!' },
        medium: { type: 'text', kind: 'Code breaker', q: 'In Glimmerwick code every letter moves one step along the alphabet, so A becomes B and B becomes C. Decode this message:',
                  visual: 'N P P O', accept: ['moon'],
                  hint: 'Move each letter one step BACK. N becomes M.',
                  explain: 'N to M, P to O, P to O, O to N. It spells MOON.' },
        hard:   { type: 'text', kind: 'Code breaker', q: 'This time every letter has moved THREE steps along the alphabet, so A becomes D. Decode this message:',
                  visual: 'R U E L W', accept: ['orbit'],
                  hint: 'Count back three letters each time: R, Q, P, O. So R is really O.',
                  explain: 'R to O, U to R, E to B, L to I, W to T. It spells ORBIT.' }
      },
      field: { type: 'number', title: 'Signal boost',
               text: 'Zib needs an even number to boost the antenna. Find a house or building number that is even. What is it?',
               validate: 'even', fail: 'That one is odd. Zib needs an EVEN number: one that ends in 0, 2, 4, 6 or 8.' },
      outro: [['z', 'Signal boosted! The next shard is somewhere green and growing. Lead on, Commander.']],
      next: 'a3'
    },

    a3: {
      place: 'The Echo Garden',
      letter: 'C',
      target: 'shard',
      challengeMult: 1.5,
      arrive: [
        ['z', 'Shhh. Shards hum when they are near living things: trees, bushes, grass and flowers.'],
        ['z', 'Can you hear it? No, neither can I. But the scanner can. Scan for it!']
      ],
      caught: [
        ['z', 'Shard three! It glows with the letter C.'],
        ['z', 'Oh dear. This shard is locked inside a puzzle. Glimmerwick shards LOVE puzzles.']
      ],
      challenge: {
        easy:   { type: 'quiz', kind: 'Riddle', q: 'What has a trunk, branches and leaves, but cannot walk?',
                  options: ['An elephant', 'A tree', 'A suitcase', 'An octopus'], answer: 1,
                  hint: 'Look around you. There might be one nearby!',
                  explain: 'A tree! Elephants have trunks too, but they can walk.' },
        medium: { type: 'number', kind: 'Pattern', q: 'The shard beeps in a pattern: 2, 4, 8, 16... What number comes next?',
                  answer: 32, hint: 'Each number is double the one before.',
                  explain: '16 doubled is 32.' },
        hard:   { type: 'text', kind: 'Logic lock', q: 'Zib, Gloop and a space-cat each have one shard: a red one, a blue one and a gold one. Zib\'s shard is not red. The space-cat has the gold one. Who has the red shard?',
                  accept: ['gloop', 'captaingloop'],
                  hint: 'If the cat has gold and Zib is not red, what colour must Zib have?',
                  explain: 'The cat has gold, so Zib must have blue. That leaves red for Gloop!' }
      },
      field: { type: 'photo', title: 'Leaf hunt',
               text: 'Find three leaves with different shapes. Only use leaves that have already fallen on the ground. Snap a photo of the weirdest one.' },
      outro: [['z', 'Whoa! The Glowing Trail is joining up with another trail. That is Gloop slime! Careful, Rangers.']],
      next: 'n4'
    },

    b2: {
      place: "Gloop's Footprints",
      letter: 'O',
      target: 'shard',
      fieldMult: 1.5,
      arrive: [
        ['z', 'Eww! Sticky purple slime on the scanner! Captain Gloop definitely came this way.'],
        ['z', 'Wait. He dropped something. Something glowing! Quick, scan for it before he comes back!']
      ],
      caught: [
        ['z', 'Shard two! Gloop dropped it, and it glows with the letter O.'],
        ['z', 'Now let us study his footprints, like real detectives.']
      ],
      challenge: {
        easy:   { type: 'quiz', kind: 'Detective', q: 'Gloop\'s footprints go: big, small, big, small, big... What comes next?',
                  options: ['Big', 'Small', 'Medium', 'A banana'], answer: 1,
                  hint: 'Say the pattern out loud.', explain: 'Big, small, big, small, big... then SMALL!' },
        medium: { type: 'number', kind: 'Detective', q: 'Gloop slid 3 steps forward, then 5 steps back, then 4 steps forward. How many steps from his starting spot did he end up?',
                  answer: 2, hint: 'Start at 0. Forward 3 makes 3. Back 5 makes...',
                  explain: '3, take away 5, add 4 makes 2 steps forward.' },
        hard:   { type: 'number', kind: 'Detective', q: 'Gloop\'s slime trail is 12 metres long. He drips a blob every 3 metres, with one blob at the very start and one at the very end. How many blobs are there?',
                  answer: 5, hint: 'Draw it! A blob at 0 metres, then one at 3 metres...',
                  explain: 'Blobs at 0, 3, 6, 9 and 12 metres makes 5 blobs. This kind of puzzle tricks lots of grown-ups!' }
      },
      field: { type: 'text', title: 'Street sign spy',
               text: 'Find a street name sign. Type the street name and Zib will turn its letters into rocket fuel.',
               reply: 'letters' },
      outro: [['z', 'The slime trail keeps going. I think Gloop is heading for his hideout. Tiptoe, Rangers!']],
      next: 'b3'
    },

    b3: {
      place: "The Pirate's Hideout",
      letter: 'C',
      target: 'shard',
      fieldMult: 1.5,
      arrive: [
        ['z', 'This looks exactly like a pirate hideout.'],
        ['z', 'Gloop thinks nobody notices a purple jelly blob hiding behind a bin. He is wrong. Scan!']
      ],
      caught: [
        ['z', 'Shard three! Gloop left it behind in a hurry. It glows with the letter C.'],
        ['g', 'HAR HAR! That shard is locked with my pirate riddle! You will never solve it!']
      ],
      challenge: {
        easy:   { type: 'quiz', kind: 'Pirate riddle', q: 'Gloop hid 2 shards in a tree and 3 shards under a bench. How many shards did he hide?',
                  options: ['4', '5', '6', '23'], answer: 1,
                  hint: 'Count on your fingers: 2, then 3 more.', explain: '2 and 3 more makes 5.' },
        medium: { type: 'text', kind: 'Pirate riddle', q: 'What has keys, but cannot open any locks?',
                  accept: ['piano', 'apiano', 'keyboard', 'akeyboard', 'computerkeyboard', 'computer'],
                  hint: 'You might play music on it.', explain: 'A piano! A computer keyboard works too.' },
        hard:   { type: 'text', kind: 'Pirate riddle', q: 'The more of me you take, the more of me you leave behind. What am I?',
                  accept: ['footsteps', 'footstep', 'steps', 'footprints', 'footprint', 'afootstep', 'afootprint'],
                  hint: 'You have been making them the whole walk!',
                  explain: 'Footsteps! You have left about a thousand behind you already.' }
      },
      field: { type: 'checklist', title: 'Colour hunt',
               text: 'Gloop\'s treasure map is colour-coded. Spot something in each colour and tick it off.',
               items: ['Red', 'Yellow', 'Blue', 'Green', 'Purple, like Gloop!'] },
      outro: [['z', 'The slime trail joins a glowing trail up ahead. Something big is waiting for us...']],
      next: 'n4'
    },

    n4: {
      place: 'The Crossroads of Stars',
      letter: 'E',
      target: 'gloop',
      arrive: [
        (s) => ['z', s.choices.trail === 'glow'
          ? 'The Glowing Trail ends here, Rangers. And look, Gloop slime joins it from the other side. Uh-oh.'
          : 'The slime trail ends here, Rangers. And look, a glowing trail joins it from the other side. Uh-oh.'],
        ['g', 'HAR HAR HARRR! Hand over your shards, tiny Zib!'],
        ['z', 'Never! Rangers, Gloop is holding the fourth shard. Find him with your scanner!']
      ],
      caught: [
        ['g', 'Oi! Give that back!'],
        ['z', 'Shard four! It glows with the letter E. But Gloop has put a riddle lock on it.'],
        ['g', 'My riddle lock is UNBREAKABLE! Har har... har?']
      ],
      challenge: {
        easy:   { type: 'quiz', kind: 'Riddle lock', q: 'I am round and I am bright, and I come out at night. What am I?',
                  options: ['The Sun', 'The Moon', 'A potato', 'A sock'], answer: 1,
                  hint: 'You might see it after bedtime.', explain: 'The Moon!' },
        medium: { type: 'text', kind: 'Riddle lock', q: 'What has a face and two hands, but no arms or legs?',
                  accept: ['clock', 'aclock', 'watch', 'awatch'],
                  hint: 'It tells you when it is bedtime.', explain: 'A clock!' },
        hard:   { type: 'text', kind: 'Riddle lock', q: 'I am an odd number. Take away one letter and I become even. What number am I?',
                  accept: ['seven', '7'],
                  hint: 'Spell the numbers out. Which one hides the word EVEN?',
                  explain: 'SEVEN. Take away the S and you get EVEN!' }
      },
      field: { type: 'timer', title: 'Freeze challenge', seconds: 20,
               intro: ['g', 'Bet you cannot stand perfectly still and silent for 20 seconds. NOBODY can!'],
               text: 'Stand still and silent for 20 seconds. Count how many different sounds you hear.',
               ask: 'How many different sounds did you hear?' },
      outro: [
        ['g', 'Hmph! Fine! Keep your silly shard!'],
        ['n', 'Captain Gloop slithers away, sniffling.'],
        ['z', 'Did Gloop look a bit sad to you? Anyway, there is one shard left, and the scanner shows two paths.'],
        ['z', 'A bright COMET signal, pointing straight at the last shard. And a quiet MOON signal. It sounds like someone crying.']
      ],
      choice: {
        fork: 'path',
        prompt: 'Which path will you take?',
        options: [
          { key: 'comet', title: 'The Comet Path', to: 'c5',
            desc: 'Follow the bright signal straight to the last shard.',
            sendoff: [['z', 'To the Comet Path! Remember: walking speed only, even when you are excited.']] },
          { key: 'moon', title: 'The Moon Path', to: 'd5',
            desc: 'Follow the sad sound. Someone might need your help.',
            sendoff: [['z', 'Let us find out who is crying. Gently, Rangers.']] }
        ]
      }
    },

    c5: {
      place: "The Comet's Tail",
      letter: 'M',
      target: 'shard',
      arrive: [
        ['z', 'Sparkles everywhere! A comet zoomed over this exact spot a thousand years ago.'],
        ['z', 'Its stardust pulls shards in like a magnet. The last one has to be here!']
      ],
      caught: [
        ['z', 'Shard five! The final shard glows with the letter M.'],
        ['z', 'Brrr, it is comet-cold. It only warms up for people who know about space.']
      ],
      challenge: {
        easy:   { type: 'quiz', kind: 'Star count', q: 'Zib saw 4 shooting stars, then 2 more. How many shooting stars did Zib see?',
                  options: ['5', '6', '7', '42'], answer: 1,
                  hint: 'Start at 4 and count 2 more.', explain: '4 and 2 more makes 6.' },
        medium: { type: 'quiz', kind: 'Space quiz', q: 'What are comets mostly made of?',
                  options: ['Fire', 'Ice, dust and rock', 'Gold', 'Cheese'], answer: 1,
                  hint: 'They grow a tail when they get near the Sun and start to melt.',
                  explain: 'Comets are like giant dirty snowballs: ice, dust and rock.' },
        hard:   { type: 'number', kind: 'Space maths', q: 'Halley\'s Comet passes Earth about every 76 years. It last came in 1986. In what year is it due back?',
                  answer: 2062, hint: 'Add 76 to 1986.',
                  explain: '1986 and 76 more is 2062. How old will you be?' }
      },
      field: { type: 'photo', title: 'Star pose',
               text: 'Make a giant star shape with your bodies, arms and legs out wide! Ask the Commander to snap a photo.' },
      outro: [
        ['z', 'All five shards! Now back to where the Pebble is hidden.'],
        ['z', 'I wonder where Gloop went...']
      ],
      next: 'finale'
    },

    d5: {
      place: 'The Moonlit Hollow',
      letter: 'M',
      target: 'gloop',
      arrive: [
        ['z', 'Shh. The sad sound is coming from right here.'],
        ['z', 'It is Captain Gloop! He is crying big purple tears.'],
        ['g', 'Nobody ever wants to play with a gooey pirate. I only took the shards so somebody would chase me.'],
        ['z', 'Oh, Gloop. Rangers, use your scanner to find him.']
      ],
      caught: [
        ['g', 'You found me! Nobody ever finds me.'],
        ['g', 'Here. You can have the last shard.'],
        ['z', 'Shard five! It glows with the letter M. Thank you, Gloop. Now, Ranger {lead}, can you help cheer him up?']
      ],
      challenge: {
        easy:   { type: 'quiz', kind: 'Kindness', q: 'What could the Rangers do to cheer Gloop up?',
                  options: ['Say hello and smile', 'Ask him to play', 'Tell him a joke', 'All of these!'], answer: 3,
                  hint: 'Are any of these bad ideas?', explain: 'All of them! Kindness comes in lots of shapes.' },
        medium: { type: 'quiz', kind: 'Joke time', q: 'Gloop loves jokes. Why did the star go to school?',
                  options: ['To get brighter!', 'To eat lunch', 'Because it was Tuesday', 'To find the Moon'], answer: 0,
                  hint: 'Clever people are sometimes called bright.',
                  explain: 'To get brighter! Gloop is laughing so hard he is wobbling.' },
        hard:   { type: 'number', kind: 'Pirate puzzle', q: 'Gloop\'s favourite puzzle: a pirate ship has a rope ladder with 6 rungs hanging over the side. 1 rung touches the water. The tide rises by 3 rungs. How many rungs are underwater now?',
                  answer: 1, hint: 'What happens to a ship when the water rises?',
                  explain: 'Still just 1! The ship floats up with the tide, and so does the ladder.' }
      },
      field: { type: 'honor', title: 'Kindness mission',
               text: 'Each Ranger says one kind thing about another Ranger. Commander, tick when everyone has had a turn.' },
      outro: [
        ['g', 'That is the nicest thing anyone has ever said near me.'],
        ['z', 'Gloop, would you like to come and watch the Pebble launch?'],
        ['g', 'Me? Really? Oh, yes please!']
      ],
      next: 'finale'
    },

    finale: {
      place: 'The Launch Pad',
      target: 'ship',
      arrive: [
        ['z', 'We made it! The Pebble is hidden right here. I left it on invisible mode.'],
        ['z', 'Find it with your scanner, Rangers!']
      ],
      caught: [
        ['z', 'There she is! The Pebble! Let us slot the shards into the Star Engine.']
      ],
      code: {
        q: 'The shard letters are glowing: {letters}. Unscramble them to make the launch code.',
        hint: 'It is an icy space traveller with a long glowing tail. It starts with C.'
      },
      ending: (s) => {
        const lines = [['sys', 'Launch code accepted. Star Engine at full power.']];
        if (s.choices.path === 'moon') {
          lines.push(['z', 'Engines humming! Gloop, are you coming?']);
          lines.push(['g', 'Can I really?']);
          lines.push(['z', 'Every crew needs a pirate.']);
          lines.push(['n', 'The Pebble rises over the rooftops, with a tiny alien and a very happy jelly blob waving from the window.']);
        } else {
          lines.push(['n', 'As the Pebble hums into life, you spot a purple blob peeking out from behind a hedge.']);
          lines.push(['z', 'Gloop! I am leaving you a spare shard. Come and visit Glimmerwick any time you like.']);
          lines.push(['g', 'Really? For me? Thanks, Rangers.']);
          lines.push(['n', 'The Pebble rises over the rooftops and shoots off into the sky.']);
        }
        lines.push(['z', s.choices.trail === 'glow'
          ? 'Thank you, Star Rangers. You cracked the Glimmerwick codes and kept each other safe.'
          : 'Thank you, Star Rangers. You tracked a space pirate like true detectives and kept each other safe.']);
        lines.push(['z', 'If you ever see a star twinkle twice, that is me saying hello.']);
        return lines;
      }
    }
  }
};
