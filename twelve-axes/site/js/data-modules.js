/* Part 2: family drill-down modules. Each item lists the expected answer for
   every tendency in the family; these items only score that family. */
(function (G) {
  var TA = (G.TA = G.TA || {});
  var I = (TA.items = TA.items || []);
  var fam = null;
  function F(f) { fam = f; }
  function L(id, q, x) { I.push({ id: id, part: 'mod', fam: fam, t: 'l', q: q, x: x }); }
  function H(id, ctx, q, x) { I.push({ id: id, part: 'mod', fam: fam, t: 'l', h: 1, ctx: ctx, q: q, x: x }); }
  // Multiple choice: x gives each tendency's choice (index, or list with the best first).
  function M(id, q, opts, x) { I.push({ id: id, part: 'mod', fam: fam, t: 'm', q: q, opts: opts.map(function (t) { return { t: t }; }), x: x }); }

  /* ---------- Marxist-Leninist ---------- */
  F('ml');
  M('ml1', 'Which assessment of Stalin comes closest to yours?', [
    'A great revolutionary whose achievements far outweigh his errors.',
    'A leader who built socialism but committed serious crimes that later leaders were right to denounce.',
    'A dictator whose rule betrayed socialism.'
  ], { ml: 0, hoxha: 0, poststalin: 1, deng: 1, hochiminh: [1, 0], castro: [1, 0], tito: 2 });
  M('ml2', 'In the Sino-Soviet split of the 1960s, which side was closer to right?', [
    'China, which accused the Soviet leadership of abandoning revolution.',
    'The Soviet Union, which accused China of adventurism and splitting the movement.',
    'Neither: both had valid points, and the split itself was the disaster.'
  ], { ml: [0, 2], poststalin: 1, hoxha: 0, tito: 2, castro: [2, 1], hochiminh: 2, deng: [2, 0] });
  H('ml3', 'In 1978 Albania under Enver Hoxha broke with China, declaring Mao\'s theory and China\'s policies revisionist.',
    'Mao Zedong was not a genuine Marxist-Leninist.',
    { ml: -0.6, poststalin: 0.2, hoxha: 1, tito: -0.3, castro: -0.6, hochiminh: -1, deng: -1 });
  L('ml4', 'Stalin\'s leadership was, on balance, positive for the international communist movement.',
    { ml: 1, poststalin: -0.2, hoxha: 1, tito: -1, castro: 0.3, hochiminh: 0.6, deng: 0.4 });
  L('ml5', 'Socialist countries should stay out of the great-power blocs and follow a non-aligned foreign policy.',
    { ml: -0.6, poststalin: -1, hoxha: 0.6, tito: 1, castro: -0.2, hochiminh: 0.2, deng: 0.4 });
  L('ml6', 'A small group of armed guerrillas can create the conditions for revolution without waiting for a mass party to be built.',
    { ml: -0.8, poststalin: -1, hoxha: -0.8, tito: -0.5, castro: 1, hochiminh: -0.2, deng: -0.8 });
  L('ml7', 'Moral incentives, such as solidarity and pride in work, should replace material incentives like bonuses as quickly as possible under socialism.',
    { ml: -0.3, poststalin: -0.6, hoxha: 0, tito: -0.6, castro: 1, hochiminh: 0, deng: -1 });
  L('ml8', 'A socialist country should rely as far as possible on its own resources and avoid dependence on foreign trade and aid, even from allies.',
    { ml: 0, poststalin: -0.6, hoxha: 1, tito: -0.4, castro: -0.4, hochiminh: -0.2, deng: -1 });
  L('ml9', 'A strong leader who embodies the revolution and the nation is essential to a socialist state.',
    { ml: 0.4, poststalin: -0.4, hoxha: 0.5, tito: 0.5, castro: 0.4, hochiminh: 0.3, deng: -0.3 });
  H('ml10', 'In 1968 Czechoslovak communists under Alexander Dubček introduced press freedom and economic reform (the Prague Spring). Warsaw Pact troops invaded and reversed it.',
    'The Prague Spring was an attempt at a better socialism, and the invasion was wrong.',
    { ml: -0.8, poststalin: -0.7, hoxha: 0, tito: 1, castro: -0.8, hochiminh: -0.5, deng: 0 });
  L('ml11', 'In colonized countries, national liberation is the most urgent task of the revolution, ahead of building socialism.',
    { ml: 0, poststalin: 0, hoxha: -0.3, tito: 0, castro: 0.4, hochiminh: 1, deng: 0 });
  L('ml12', 'A socialist country can pass through a long stage of market economy and private capital, lasting a century or more, under Communist Party leadership.',
    { ml: -0.6, poststalin: -0.5, hoxha: -1, tito: 0.3, castro: -0.3, hochiminh: 0.6, deng: 1 });
  L('ml13', 'Once socialism is secure, the Communist Party\'s monopoly on power should be relaxed to allow competitive elections.',
    { ml: -0.6, poststalin: -0.6, hoxha: -1, tito: -0.3, castro: -0.6, hochiminh: -0.5, deng: -0.8 });

  /* ---------- Maoist ---------- */
  F('mao');
  H('m1', 'From 1966 to 1976 Mao led the Cultural Revolution, mobilizing students and workers against party officials accused of taking the capitalist road.',
    'The Cultural Revolution was the high point of socialism in the 20th century.',
    { mzt: 0.8, mlm: 0.9, gonzalo: 1, naxal: 0.7, mtw: 0.6, prachanda: 0.3, avakian: 0.8 });
  L('m2', 'Protracted people\'s war, a long armed struggle building base areas, is the universal path to revolution, including in rich countries.',
    { mzt: -0.3, mlm: 0.3, gonzalo: 1, naxal: 0.6, mtw: -0.3, prachanda: -0.5, avakian: -0.6 });
  L('m3', 'Most workers in rich countries benefit from the exploitation of the Third World and are not a revolutionary class.',
    { mzt: -0.4, mlm: -0.5, gonzalo: -0.3, naxal: 0, mtw: 1, prachanda: -0.3, avakian: -0.2 });
  L('m4', 'Once a people\'s war has gained enough strength, a Maoist party can enter parliament and compete in multiparty elections.',
    { mzt: -0.3, mlm: -0.8, gonzalo: -1, naxal: -1, mtw: -0.6, prachanda: 1, avakian: -0.8 });
  L('m5', 'After a revolution, socialist society must allow dissent and open debate, including from non-communists, to avoid repeating past errors.',
    { mzt: -0.3, mlm: -0.2, gonzalo: -0.8, naxal: -0.3, mtw: -0.3, prachanda: 0.6, avakian: 0.9 });
  L('m6', 'A revolutionary party should recognize its leader\'s thought as a new development of Marxism that guides the whole struggle.',
    { mzt: 0.6, mlm: 0, gonzalo: 1, naxal: -0.2, mtw: -0.3, prachanda: 0.4, avakian: 0.8 });
  L('m7', 'Mao\'s Three Worlds theory, which treated the Soviet Union as the main enemy and allowed alliances with the US, was correct.',
    { mzt: 0.6, mlm: -0.6, gonzalo: -0.8, naxal: -0.6, mtw: -0.3, prachanda: -0.2, avakian: -0.8 });
  L('m8', 'In countries like India, caste and the oppression of tribal communities are as central to revolution as class.',
    { mzt: 0, mlm: 0.3, gonzalo: -0.2, naxal: 1, mtw: 0.4, prachanda: 0.6, avakian: 0.3 });
  L('m9', 'Revolutionaries in rich countries should put supporting national liberation struggles in the Global South ahead of organizing workers at home.',
    { mzt: 0.2, mlm: -0.2, gonzalo: -0.4, naxal: 0.2, mtw: 1, prachanda: 0, avakian: -0.3 });
  L('m10', 'Communism is a science, and its findings must be followed even when they contradict what the oppressed themselves believe.',
    { mzt: 0, mlm: 0.2, gonzalo: 0.3, naxal: -0.2, mtw: -0.2, prachanda: -0.3, avakian: 1 });
  L('m11', 'China restored capitalism after Mao\'s death, beginning with Deng Xiaoping.',
    { mzt: 0.2, mlm: 1, gonzalo: 1, naxal: 1, mtw: 0.8, prachanda: 0.3, avakian: 1 });
  L('m12', 'In wealthy countries the most promising revolutionary forces are the most oppressed sections of society, such as racially oppressed communities and the very poor, rather than the organized labor movement.',
    { mzt: 0, mlm: 0.6, gonzalo: 0.3, naxal: 0.3, mtw: 0.8, prachanda: 0, avakian: 0.9 });

  /* ---------- Trotskyist ---------- */
  F('trot');
  L('r1', 'The Soviet Union remained a workers\' state, though a bureaucratically degenerated one, until its collapse.',
    { orthotrot: 1, pablo: 0.8, grant: 1, moreno: 0.8, cliff: -1, shacht: -1, sparts: 1, posad: 1 });
  L('r2', 'The Soviet Union was state capitalist, with the bureaucracy acting as a collective capitalist.',
    { orthotrot: -1, pablo: -0.8, grant: -1, moreno: -0.8, cliff: 1, shacht: -0.3, sparts: -1, posad: -1 });
  L('r3', 'The Soviet Union was a new type of exploitative society, neither capitalist nor socialist.',
    { orthotrot: -1, pablo: -0.8, grant: -1, moreno: -0.8, cliff: -0.5, shacht: 1, sparts: -1, posad: -1 });
  L('r4', 'Revolutionaries should join mass reformist or labor parties and work inside them for long periods, rather than build small independent parties.',
    { orthotrot: -0.6, pablo: 0.6, grant: 1, moreno: -0.5, cliff: -0.6, shacht: 0.2, sparts: -1, posad: -0.3 });
  L('r5', 'Revolutionaries should orient toward Third World guerrilla and national liberation movements even when those are not led by Trotskyists.',
    { orthotrot: -0.6, pablo: 1, grant: -0.5, moreno: 0.3, cliff: -0.2, shacht: -0.3, sparts: -0.6, posad: 0.6 });
  L('r6', 'Socialists should back popular democratic uprisings against dictatorships even when socialists do not lead them, since they can grow into socialist revolutions.',
    { orthotrot: -0.3, pablo: 0.4, grant: 0, moreno: 1, cliff: 0.8, shacht: 0.6, sparts: -0.8, posad: -0.3 });
  L('r7', 'Revolutionaries should unconditionally defend North Korea, China and Cuba against imperialist attack, while opposing their ruling bureaucracies.',
    { orthotrot: 0.6, pablo: 0.4, grant: 0.5, moreno: 0, cliff: -0.8, shacht: -1, sparts: 1, posad: 0.8 });
  L('r8', 'A revolutionary tendency should be judged by the correctness of its program, even if keeping that program pure leaves it very small.',
    { orthotrot: 0.6, pablo: -0.3, grant: -0.2, moreno: 0.2, cliff: -0.4, shacht: -0.5, sparts: 1, posad: 0.3 });
  L('r9', 'A nuclear war between the great powers, however terrible, could open the way to world socialism.',
    { orthotrot: -1, pablo: -1, grant: -1, moreno: -1, cliff: -1, shacht: -1, sparts: -1, posad: 1 });
  L('r10', 'Any civilization advanced enough to travel between the stars would necessarily have abolished capitalism.',
    { orthotrot: -0.3, pablo: -0.3, grant: -0.3, moreno: -0.3, cliff: -0.3, shacht: -0.3, sparts: -0.5, posad: 1 });
  L('r11', 'During the Cold War, socialists should have sided with neither Washington nor Moscow.',
    { orthotrot: -0.6, pablo: -0.4, grant: -0.4, moreno: -0.2, cliff: 1, shacht: 1, sparts: -1, posad: -1 });
  L('r12', 'When forced to choose, socialists should prefer Western liberal democracies over Stalinist states.',
    { orthotrot: -1, pablo: -1, grant: -1, moreno: -0.6, cliff: -0.8, shacht: 0.8, sparts: -1, posad: -1 });
  H('r13', 'In 1959 Fidel Castro\'s guerrilla movement, which was not Trotskyist or even communist at the time, took power in Cuba and went on to nationalize the economy.',
    'A revolution led by non-Trotskyist revolutionaries, as in Cuba, can create a genuine workers\' state.',
    { orthotrot: -0.6, pablo: 1, grant: 0.5, moreno: 0.6, cliff: -1, shacht: -1, sparts: 0.5, posad: 0.8 });

  /* ---------- Classical and pre-Leninist ---------- */
  F('classic');
  L('cl1', 'The final goal of socialism matters less than the movement itself and the reforms it wins day to day.',
    { kautsky: -1, bernstein: 1, austro: -0.3, lassalle: 0.4 });
  L('cl2', 'Socialist revolution will come from capitalism\'s own development. A socialist party\'s job is to organize the working class and prepare, not to make the revolution happen.',
    { kautsky: 1, bernstein: -0.3, austro: 0.6, lassalle: 0 });
  L('cl5', 'An existing state, made democratic through universal suffrage, can fund workers\' cooperatives and bring about socialism.',
    { kautsky: -0.4, bernstein: 0.4, austro: 0.2, lassalle: 1 });
  L('cl7', 'Each nationality in a multinational state should form a self-governing cultural community, regardless of where its members live.',
    { kautsky: -0.4, bernstein: 0, austro: 1, lassalle: -0.3 });
  L('cl8', 'Marx\'s prediction that capitalism would polarize society into a tiny bourgeoisie and an impoverished mass has been proven wrong, and socialist theory must be revised to match.',
    { kautsky: -1, bernstein: 1, austro: 0.2, lassalle: 0 });
  L('cl11', 'Workers\' councils can exist alongside an elected parliament as a permanent part of socialist democracy.',
    { kautsky: -0.3, bernstein: -0.4, austro: 1, lassalle: -0.6 });
  L('cl13', 'A socialist party should refuse ministerial posts in a coalition with bourgeois parties until it can govern on its own program.',
    { kautsky: 0.8, bernstein: -0.8, austro: 0.4, lassalle: -0.4 });
  L('cl14', 'In a multinational state, socialism requires a federation of self-governing nationalities rather than a centralized republic.',
    { kautsky: -0.4, bernstein: 0, austro: 1, lassalle: -0.8 });
  L('cl12', 'Socialists should be willing to deal with a strong national government, even a conservative one, to win social reforms for workers.',
    { kautsky: -0.8, bernstein: 0.2, austro: -0.4, lassalle: 1 });

  /* ---------- Left communist and syndicalist ---------- */
  F('leftcom');
  L('lc1', 'Socialists should take part in parliamentary elections, at least to use them as a platform.',
    { lux: 1, council: -1, bordiga: -1, communization: -1, situ: -1, revsynd: -0.6 });
  L('lc2', 'Workers\' self-management of individual enterprises is not socialism. It just turns workers into managers of their own exploitation.',
    { lux: 0, council: -0.8, bordiga: 1, communization: 1, situ: -0.6, revsynd: -1 });
  L('lc3', 'Democracy, including workers\' democracy, is not a principle of communism. What matters is the correct program, not majority votes.',
    { lux: -1, council: -0.8, bordiga: 1, communization: 0.3, situ: -0.6, revsynd: -0.5 });
  L('lc4', 'There should be no transitional period. The revolution should immediately abolish money, wages and exchange.',
    { lux: -0.6, council: -0.4, bordiga: -0.5, communization: 1, situ: 0.4, revsynd: -0.3 });
  L('lc6', 'Industrial unions, organized by industry rather than craft, should become the governing bodies of a socialist society.',
    { lux: -0.2, council: 0.2, bordiga: -1, communization: -1, situ: -0.2, revsynd: 0.9 });
  L('lc7', 'Trade unions have become part of the capitalist system and can no longer serve as organs of revolution.',
    { lux: -0.4, council: 1, bordiga: 0.6, communization: 1, situ: 0.8, revsynd: -1 });
  L('lc8', 'Modern capitalism rules less through force than through spectacle: images, consumption and entertainment that make people passive spectators of their own lives.',
    { lux: -0.2, council: 0, bordiga: -0.6, communization: 0.4, situ: 1, revsynd: -0.3 });
  L('lc9', 'A general strike, rather than an insurrection or an election, is the main way capitalism will be overthrown.',
    { lux: 0.6, council: 0.3, bordiga: -0.6, communization: 0, situ: 0, revsynd: 1 });
  L('lc10', 'Revolutionary unions should be open to all workers whatever their political views, rather than tied to an ideology or party.',
    { lux: -0.2, council: 0, bordiga: -0.8, communization: -0.4, situ: -0.3, revsynd: 1 });
  L('lc11', 'The October Revolution of 1917 was a genuine proletarian revolution, even if it later degenerated.',
    { lux: 1, council: -0.4, bordiga: 1, communization: -0.2, situ: -0.2, revsynd: 0.4 });
  L('lc12', 'The revolutionary party should be a small, centralized body that preserves the communist program unchanged, not a mass organization.',
    { lux: -1, council: -1, bordiga: 1, communization: -0.6, situ: -0.6, revsynd: -0.8 });
  L('lc13', 'Subverting everyday life, by refusing work and turning advertising and media against themselves, is as revolutionary as organized political activity.',
    { lux: -0.6, council: -0.3, bordiga: -1, communization: 0.3, situ: 1, revsynd: -0.2 });

  /* ---------- Autonomist and libertarian Marxist ---------- */
  F('auto');
  L('au1', 'The working class drives capitalist development: capital restructures itself in response to workers\' struggles, not the other way around.',
    { operaismo: 1, postop: 0.8, autonomism: 0.8, libmarx: 0.2, autog: 0.2 });
  L('au2', 'Refusing work itself, not just demanding better conditions, is central to working-class struggle.',
    { operaismo: 0.8, postop: 0.6, autonomism: 1, libmarx: 0, autog: -0.2 });
  L('au3', 'Today\'s revolutionary subject is the "multitude", a diverse network of workers, precarious people, migrants and others, rather than the industrial working class.',
    { operaismo: -0.6, postop: 1, autonomism: 0.5, libmarx: -0.2, autog: 0 });
  L('au4', 'Immaterial and cognitive labor, such as knowledge, communication and care, has become the dominant form of production.',
    { operaismo: -0.3, postop: 1, autonomism: 0.4, libmarx: -0.2, autog: 0 });
  L('au5', 'Occupied social centers, squats and autonomous spaces are important bases for building a new society now.',
    { operaismo: 0, postop: 0.4, autonomism: 1, libmarx: 0.3, autog: 0.4 });
  L('au6', 'Detailed workers\' inquiry, studying how workers actually organize and resist on the job, should come before any political program.',
    { operaismo: 1, postop: 0.3, autonomism: 0.6, libmarx: 0.4, autog: 0.3 });
  L('au7', 'Marx\'s ideas, rightly read, are fundamentally libertarian and anti-authoritarian, and Leninist parties distorted them.',
    { operaismo: 0.3, postop: 0.4, autonomism: 0.5, libmarx: 1, autog: 0.6 });
  L('au8', 'Socialists should demand a guaranteed income for everyone, whether or not they work.',
    { operaismo: 0.5, postop: 1, autonomism: 0.8, libmarx: 0, autog: 0 });
  L('au9', 'The sovereignty of nation-states is giving way to a global network of power with no single center.',
    { operaismo: -0.4, postop: 1, autonomism: 0.3, libmarx: -0.3, autog: -0.3 });
  L('au10', 'The goal is a society of freely associated producers organized through councils, as Marx described in his writings on the Paris Commune.',
    { operaismo: 0.3, postop: 0, autonomism: 0.4, libmarx: 1, autog: 0.7 });

  L('au11', 'The right to the city means residents collectively shaping urban space, not just having access to decent housing.',
    { operaismo: 0, postop: 0.6, autonomism: 0.6, libmarx: 0.4, autog: 1 });
  L('au12', 'Self-management should be pursued through existing unions, parties and municipalities, transforming them, not only through autonomous spaces outside them.',
    { operaismo: -0.2, postop: -0.4, autonomism: -0.8, libmarx: 0, autog: 1 });
  L('au13', 'Everyday life (housing, leisure, consumption, the use of time) is where alienation is felt most and where revolution has to begin.',
    { operaismo: -0.4, postop: 0.2, autonomism: 0.6, libmarx: 0.2, autog: 1 });
  H('au14', 'In 1973 workers at the LIP watch factory in France occupied it after a closure was announced, ran production themselves and sold watches to pay their own wages.',
    'The LIP occupation points to the kind of socialism worth building.',
    { operaismo: 0.2, postop: 0.2, autonomism: 0.6, libmarx: 0.7, autog: 1 });

  /* ---------- Anarchist ---------- */
  F('anarch');
  L('an1', 'In a free society, goods should be distributed according to need, not according to how much each person works.',
    { ancom: 1, ansynd: 0.4, collectivist: -0.6, platform: 0.8, insurrect: 0.6, synthesis: 0.3, mutualism: -1, socialeco: 0.6, demconf: 0.2 });
  L('an2', 'Each worker should receive the full product of their labor, with markets and mutual credit coordinating exchange.',
    { ancom: -1, ansynd: -0.6, collectivist: 0, platform: -0.8, insurrect: -0.6, synthesis: -0.2, mutualism: 1, socialeco: -0.6, demconf: -0.4 });
  L('an3', 'Anarchists should form a specific political organization with shared theory, shared tactics and collective responsibility.',
    { ancom: 0.2, ansynd: 0.2, collectivist: 0.4, platform: 1, insurrect: -1, synthesis: -0.5, mutualism: -0.3, socialeco: 0.5, demconf: 0.6 });
  L('an4', 'Formal organizations, even anarchist ones, tend to become bureaucratic. Informal affinity groups acting directly are better.',
    { ancom: 0.2, ansynd: -0.8, collectivist: -0.3, platform: -1, insurrect: 1, synthesis: -0.2, mutualism: 0, socialeco: -0.6, demconf: -0.8 });
  L('an5', 'Anarchists of different schools (communist, syndicalist, individualist) should unite in common federations despite their differences.',
    { ancom: 0, ansynd: 0, collectivist: 0, platform: -0.6, insurrect: -0.4, synthesis: 1, mutualism: 0.3, socialeco: -0.4, demconf: 0 });
  L('an6', 'Revolutionary unions are the main vehicle for overthrowing capitalism and organizing the new society.',
    { ancom: -0.2, ansynd: 1, collectivist: 0.4, platform: 0.3, insurrect: -0.8, synthesis: 0, mutualism: -0.4, socialeco: -0.6, demconf: -0.3 });
  L('an7', 'Communities should run their economies through local citizens\' assemblies, rather than handing control to the workers in each industry.',
    { ancom: 0.2, ansynd: -0.8, collectivist: -0.2, platform: -0.2, insurrect: -0.2, synthesis: 0, mutualism: -0.3, socialeco: 1, demconf: 0.8 });
  L('an8', 'Anarchists should run in local elections to win municipal councils and turn them into popular assemblies.',
    { ancom: -0.8, ansynd: -0.8, collectivist: -0.8, platform: -0.8, insurrect: -1, synthesis: -0.6, mutualism: -0.3, socialeco: 0.9, demconf: 0.6 });
  L('an9', 'Women\'s liberation is the foundation of a free society, and women need their own autonomous organizations, including armed units, to secure it.',
    { ancom: 0.3, ansynd: 0, collectivist: 0, platform: 0.2, insurrect: 0.2, synthesis: 0.2, mutualism: 0, socialeco: 0.3, demconf: 1 });
  L('an10', 'A stateless democratic confederation can work in practice, as Rojava in Northeast Syria shows.',
    { ancom: 0.3, ansynd: 0.3, collectivist: 0.3, platform: 0.4, insurrect: -0.4, synthesis: 0.3, mutualism: 0.2, socialeco: 0.8, demconf: 1 });
  L('an11', 'A revolutionary movement can accept military cooperation from a state, even the United States, if it protects the revolution.',
    { ancom: -0.6, ansynd: -0.6, collectivist: -0.6, platform: -0.6, insurrect: -1, synthesis: -0.5, mutualism: -0.4, socialeco: 0, demconf: 0.8 });
  H('an12', 'In November 1936, during the Spanish Civil War, four leaders of the anarchist CNT became ministers in the Republican government.',
    'The CNT was right to join the Republican government during the war.',
    { ancom: -0.6, ansynd: 0, collectivist: -0.3, platform: -0.8, insurrect: -1, synthesis: -0.2, mutualism: -0.2, socialeco: -0.2, demconf: 0.4 });
  L('an13', 'Attacks on property and direct confrontation with the state should start now, without waiting for mass movements.',
    { ancom: -0.2, ansynd: -0.6, collectivist: 0, platform: -0.6, insurrect: 1, synthesis: -0.3, mutualism: -0.8, socialeco: -0.8, demconf: -0.6 });
  L('an14', 'In a free society, each person should be paid according to the labor they contribute, through collectively owned means of production.',
    { ancom: -0.8, ansynd: 0.2, collectivist: 1, platform: -0.4, insurrect: -0.4, synthesis: 0, mutualism: 0.4, socialeco: -0.3, demconf: 0 });

  /* ---------- Democratic and reformist ---------- */
  F('demsoc');
  M('d1', 'What is the long-term goal?', [
    'A market economy with a strong welfare state and powerful unions.',
    'A mixed economy in which the commanding heights are public and capital answers to democratic control.',
    'A society beyond capitalism, with production socialized and run democratically.',
    'A self-managed socialism in which workers and communities run the economy and public life.'
  ], { socdem: 0, leftpop: [1, 0], leftcon: [1, 0], fabian: 1, eurocomm: [1, 2], demsoc: [2, 1], lefteuro: [3, 2] });
  M('d2', 'A left party wins office. Its relationship to the existing state should be to:', [
    'Govern through it as it is, relying on the civil service\'s expertise.',
    'Reform it gradually, appointing allies and passing new laws.',
    'Transform it from within, while building new democratic institutions outside it that can pressure and eventually replace parts of it.',
    'Bypass it with direct appeals to the people and new institutions loyal to the movement.'
  ], { socdem: 0, fabian: 0, eurocomm: [1, 0], demsoc: [1, 2], leftcon: [1, 0], lefteuro: 2, leftpop: [3, 1] });
  H('d3', 'In 1973, after the coup in Chile, the Italian Communist leader Enrico Berlinguer proposed a "historic compromise" with the Christian Democrats to protect democracy and win reforms.',
    'The historic compromise was the right strategy.',
    { demsoc: -0.2, socdem: 0.4, fabian: 0.2, eurocomm: 1, lefteuro: -0.8, leftpop: -0.4, leftcon: 0 });
  L('d4', 'A left government will reach a decisive moment when it must break with the institutions of capital, even at the risk of illegality, rather than keep reforming them.',
    { demsoc: 0.2, socdem: -1, fabian: -1, eurocomm: -0.6, lefteuro: 1, leftpop: 0.2, leftcon: -0.4 });
  L('d5', 'Politics is fundamentally a struggle between "the people" and "the elite", and the left should build a broad popular identity around that divide rather than around class.',
    { demsoc: -0.3, socdem: -0.4, fabian: -0.6, eurocomm: -0.2, lefteuro: -0.4, leftpop: 1, leftcon: 0.5 });
  L('d6', 'The left lost working-class voters by focusing on progressive cultural causes and should move toward conservative positions on immigration and family.',
    { demsoc: -0.8, socdem: -0.3, fabian: -0.4, eurocomm: -0.6, lefteuro: -0.8, leftpop: -0.2, leftcon: 1 });
  M('d7', 'How does a long struggle for influence in culture, unions and civil society relate to winning power?', [
    'It is the whole strategy: socialism advances as the left gains ground in institutions, with no decisive break.',
    'It prepares the ground, but it has to end in a political rupture with capital.',
    'It matters less than winning elections and governing well.',
    'It matters less than building a popular movement around a leader who can win power quickly.'
  ], { eurocomm: 0, fabian: [0, 2], lefteuro: 1, demsoc: [1, 0], socdem: 2, leftcon: [2, 3], leftpop: 3 });
  L('d8', 'Socialist change should come gradually, by winning over existing parties and institutions from inside, rather than through mass mobilization.',
    { demsoc: -0.4, socdem: 0.2, fabian: 1, eurocomm: 0.2, lefteuro: -0.8, leftpop: -0.8, leftcon: -0.2 });
  L('d9', 'Left movements need a charismatic leader who can personify the popular will.',
    { demsoc: -0.6, socdem: -0.6, fabian: -0.6, eurocomm: -0.4, lefteuro: -0.6, leftpop: 0.9, leftcon: 0.5 });
  L('d10', 'Socialists should drop nationalization as a central goal and focus on redistribution and public services.',
    { demsoc: -0.8, socdem: 0.8, fabian: -0.6, eurocomm: -0.2, lefteuro: -0.8, leftpop: 0.2, leftcon: -0.4 });
  L('d11', 'Mass movements outside parliament, such as strikes and occupations, are essential to any left government\'s success.',
    { demsoc: 1, socdem: -0.2, fabian: -0.6, eurocomm: 0.3, lefteuro: 1, leftpop: 0.6, leftcon: 0 });
  L('d12', 'Workers\' self-management and neighborhood councils are as important to socialism as public ownership.',
    { demsoc: 0.4, socdem: -0.4, fabian: -0.8, eurocomm: 0, lefteuro: 0.9, leftpop: 0.2, leftcon: -0.4 });
  L('d13', 'A socialist party should keep a clear political line and organized discipline, rather than becoming a loose electoral machine.',
    { demsoc: -0.4, socdem: -0.6, fabian: 0, eurocomm: 0.3, lefteuro: 0.5, leftpop: -0.4, leftcon: 0 });
  L('d14', 'Universal suffrage, multiparty elections and civil liberties must be kept throughout the transition, alongside new forms of direct democracy.',
    { demsoc: 1, socdem: 0.8, fabian: 0.6, eurocomm: 1, lefteuro: 0.9, leftpop: 0.4, leftcon: 0.3 });

  /* ---------- Market, cooperative and planning models ---------- */
  F('econ');
  L('ec1', 'A central planning board could simulate a market by adjusting prices until supply meets demand.',
    { marketsoc: 1, econdem: -0.2, coop: -0.4, guild: -0.3, parecon: -0.6, cyber: 0, accel: 0, platcoop: -0.3 });
  L('ec2', 'Investment should be allocated democratically through public banks, while firms run by their workers compete in markets for goods.',
    { marketsoc: 0.2, econdem: 1, coop: 0.3, guild: 0.2, parecon: -0.8, cyber: -0.8, accel: -0.2, platcoop: 0.4 });
  L('ec3', 'Building worker cooperatives inside capitalism, step by step, is the most realistic path to socialism.',
    { marketsoc: -0.4, econdem: 0, coop: 1, guild: 0.4, parecon: -0.3, cyber: -0.6, accel: -0.6, platcoop: 0.9 });
  L('ec4', 'Industries should be run by national guilds of workers, with consumers represented by a separate democratic body.',
    { marketsoc: -0.4, econdem: -0.2, coop: 0, guild: 1, parecon: 0.3, cyber: -0.6, accel: -0.4, platcoop: -0.2 });
  L('ec5', 'Workers and consumers should plan the economy together through nested councils that negotiate the plan over several rounds, with no markets and no central planners.',
    { marketsoc: -1, econdem: -0.6, coop: -0.3, guild: 0.2, parecon: 1, cyber: -0.3, accel: -0.2, platcoop: -0.2 });
  L('ec6', 'People should be paid according to the effort and sacrifice they put in, not according to their output or talent.',
    { marketsoc: -0.6, econdem: -0.3, coop: 0, guild: 0, parecon: 1, cyber: 0.2, accel: -0.3, platcoop: 0 });
  L('ec7', 'Jobs should be redesigned so everyone does a fair share of both empowering and routine tasks.',
    { marketsoc: -0.4, econdem: -0.2, coop: 0.2, guild: 0.4, parecon: 1, cyber: 0, accel: -0.2, platcoop: 0.2 });
  L('ec8', 'Workers should be paid in labor vouchers that record hours worked, instead of money.',
    { marketsoc: -1, econdem: -0.8, coop: -0.6, guild: -0.4, parecon: -0.4, cyber: 1, accel: -0.3, platcoop: -0.6 });
  L('ec9', 'A socialist economy can be computed: input-output tables and modern computers can find the most efficient plan.',
    { marketsoc: -0.6, econdem: -0.6, coop: -0.6, guild: -0.6, parecon: -0.4, cyber: 1, accel: 0.6, platcoop: -0.4 });
  L('ec10', 'The left should make full automation, a much shorter working week and universal basic income its core program.',
    { marketsoc: -0.2, econdem: -0.2, coop: -0.2, guild: -0.4, parecon: -0.4, cyber: -0.2, accel: 1, platcoop: 0.2 });
  L('ec11', 'Gig-economy workers are best served by building their own app-based cooperatives.',
    { marketsoc: 0, econdem: 0.3, coop: 0.6, guild: 0.2, parecon: 0, cyber: -0.3, accel: 0, platcoop: 1 });
  L('ec13', 'Data generated by users of digital platforms should be owned collectively by those users, not by the platform company.',
    { marketsoc: 0, econdem: 0.2, coop: 0.2, guild: 0, parecon: 0.4, cyber: -0.2, accel: 0.5, platcoop: 1 });
  L('ec14', 'Traditional consumer cooperatives, credit unions and mutual societies are the backbone of a cooperative economy.',
    { marketsoc: -0.2, econdem: 0, coop: 1, guild: 0.3, parecon: -0.4, cyber: -0.6, accel: -0.6, platcoop: 0.1 });
  L('ec15', 'The cooperative movement\'s most urgent task is to build alternatives to the big tech platforms.',
    { marketsoc: -0.2, econdem: 0, coop: -0.2, guild: -0.2, parecon: 0, cyber: -0.2, accel: 0.2, platcoop: 1 });
  L('ec12', 'Craft and meaningful work matter as much as efficiency. Mass industrial production should give way to skilled, self-directed work.',
    { marketsoc: -0.4, econdem: -0.2, coop: 0.2, guild: 1, parecon: 0.2, cyber: -0.8, accel: -1, platcoop: -0.2 });

  /* ---------- Republican socialism ---------- */
  F('repub');
  L('rp1', 'In a colonized or partitioned nation, the struggle for national independence and the struggle for socialism are one and the same.',
    { connolly: 1, laborrep: -0.2, commonwealth: -0.2 });
  L('rp2', 'Workers should pool their savings into producer cooperatives that gradually replace private employers, alongside political action.',
    { connolly: 0, laborrep: 1, commonwealth: 0.2 });
  L('rp3', 'Industry should be organized like a national public service, with every citizen enrolled and paid on equal terms.',
    { connolly: -0.4, laborrep: -0.6, commonwealth: 1 });
  L('rp4', 'The struggle for a shorter working day is a struggle for citizenship: free time is the precondition of self-government.',
    { connolly: 0.2, laborrep: 1, commonwealth: 0.4 });
  L('rp5', 'Railroads, utilities, banks and other monopolies should be taken into public ownership and run for the whole nation.',
    { connolly: 0.4, laborrep: 0.3, commonwealth: 1 });
  L('rp6', 'A labor movement should unite all producers, including farmers and small proprietors, against monopoly and finance.',
    { connolly: -0.2, laborrep: 1, commonwealth: 0.6 });
  H('rp7', 'In 1916 the Irish Citizen Army joined the Easter Rising in Dublin, knowing it had little chance of military success.',
    'An armed rising can be justified to keep a cause alive, even without the support of most of the people at the time.',
    { connolly: 1, laborrep: -0.6, commonwealth: -0.8 });
  L('rp8', 'Industrial unions should become the administrative structure of the future workers\' republic.',
    { connolly: 0.8, laborrep: 0.2, commonwealth: -0.4 });
  L('rp9', 'Socialism will come through the ballot box, as citizens vote public ownership into being one step at a time.',
    { connolly: -0.4, laborrep: 0.2, commonwealth: 1 });
  H('rp10', 'In 1886 the Knights of Labor had around 700,000 members, organizing skilled and unskilled, Black and white, men and women, around cooperatives and the eight-hour day.',
    'The Knights of Labor\'s mix of cooperation, politics and broad producer unity was a better model than the craft unionism that replaced it.',
    { connolly: 0.3, laborrep: 1, commonwealth: 0.6 });
  L('rp11', 'Strikes are a last resort; arbitration and cooperation are the better way for labor to win its independence.',
    { connolly: -1, laborrep: 0.6, commonwealth: 0.4 });
  L('rp12', 'Socialists should claim their country\'s founding democratic declarations and revolutionary traditions as their own, rather than treat them as bourgeois relics.',
    { connolly: 0.8, laborrep: 1, commonwealth: 0.9 });

  /* ---------- Ecological ---------- */
  F('eco');
  L('eco1', 'The climate emergency justifies emergency state powers: rationing, nationalizing fossil fuel companies and forcibly winding down polluting industries.',
    { ecosoc: 0.3, degrowth: 0, ecolen: 1 });
  L('eco2', 'The main goal must be to slow down production and consumption in rich countries, not just to switch to green technology.',
    { ecosoc: 0.3, degrowth: 1, ecolen: 0.2 });
  L('eco3', 'Capitalism\'s "metabolic rift" between society and nature can only be healed by overcoming the division between town and country.',
    { ecosoc: 1, degrowth: 0.6, ecolen: 0.3 });
  L('eco4', 'Sabotaging fossil fuel infrastructure is a legitimate tactic for the climate movement.',
    { ecosoc: 0, degrowth: -0.3, ecolen: 1 });
  L('eco5', 'Green growth, expanding the economy while decarbonizing it, is possible under socialist planning.',
    { ecosoc: 0.4, degrowth: -1, ecolen: 0.2 });
  L('eco6', 'In his late work Marx abandoned his faith in the productive forces and moved toward a vision of a steady-state, communal society.',
    { ecosoc: 0.2, degrowth: 1, ecolen: -0.2 });
  L('eco7', 'Shorter working hours and expanded free public services ("public luxury") should replace consumer goods as the measure of prosperity.',
    { ecosoc: 0.6, degrowth: 1, ecolen: 0.3 });
  L('eco8', 'The climate movement should build a broad grassroots movement rather than aim to capture state power.',
    { ecosoc: 0.4, degrowth: 0.6, ecolen: -0.8 });
})(typeof globalThis !== 'undefined' ? globalThis : window);
