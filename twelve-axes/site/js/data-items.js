/* Part 1 items, answered by everyone.
   Likert items (L, H): l = loadings, agreeing moves you toward the + pole.
   Multiple-choice items (M, HM): each option sits at a position on the scales
   it names (v). A tendency's fit to an option is its distance from that
   position, so middle and hybrid options are fully scoreable.
   x = hand-set expectations: for Likert a value in -1..1, for multiple choice
   the option index (or list of acceptable indexes, best first) a tendency
   would pick. tag = tag scores the answer feeds. */
(function (G) {
  var TA = (G.TA = G.TA || {});
  var I = (TA.items = TA.items || []);
  function L(id, q, l, x, tag) { I.push({ id: id, part: 'core', t: 'l', q: q, l: l, x: x || null, tag: tag || null }); }
  function H(id, ctx, q, l, x, tag) { I.push({ id: id, part: 'core', t: 'l', h: 1, ctx: ctx, q: q, l: l, x: x || null, tag: tag || null }); }
  function M(id, q, opts, x) { I.push({ id: id, part: 'core', t: 'm', q: q, opts: opts, x: x || null }); }
  function HM(id, ctx, q, opts, x) { I.push({ id: id, part: 'core', t: 'm', h: 1, ctx: ctx, q: q, opts: opts, x: x || null }); }
  function O(t, v, tag) { return { t: t, v: v, tag: tag || null }; }

  /* ===== Transition (Rupture - / Continuity +) and Arena (Institutional - / Extra-institutional +) ===== */
  M('s1', 'A left government elected with 41% of the vote faces a capital strike: investment frozen, money fleeing abroad, and a constitutional court striking down its main laws. What should it do?', [
    O('Scale back the program to restore business confidence and hold its coalition together.', { rupture: 1, arena: -1 }),
    O('Keep governing within the rules, accept the court\'s rulings, and campaign for a bigger majority next time.', { rupture: 0.6, arena: -1 }),
    O('Impose capital controls and take over key banks under emergency powers, while calling mass demonstrations and strikes in its defense.', { rupture: -0.4, arena: -0.2 }),
    O('Refuse to apply the court\'s rulings where they block its mandate, and back workers occupying the struck firms, even into open illegality.', { rupture: -0.7, arena: 0.4 }),
    O('Treat the government as a platform only: the real task is building workers\' councils and preparing for a confrontation outside it.', { rupture: -1, arena: 1 })
  ], { lefteuro: [3, 2], eurocomm: 1, socdem: [0, 1], demsoc: [2, 3], ml: 4, orthotrot: 4, council: 4 });
  M('s2', 'If capitalism ends, how is it most likely to happen?', [
    O('Through a long accumulation of reforms, until the economy is mostly socialized without any single decisive moment.', { rupture: 1, arena: -0.8 }),
    O('Through a democratic government whose reforms provoke a crisis, won by combining electoral power with mass mobilization and a break with capital.', { rupture: -0.4, arena: -0.1 }),
    O('Through a revolutionary crisis in which a mass movement takes power directly and replaces the old state.', { rupture: -1, arena: 0.8 }),
    O('Through the spread of self-managed communities and institutions that gradually make capitalism irrelevant.', { rupture: 0.4, arena: 0.8 })
  ]);
  L('s3', 'Even a left government with a large majority will eventually reach a point where it must override parts of the existing courts, police command or civil service in order to survive.', { rupture: -1 });
  L('s4', 'A left government should respect court rulings and constitutional limits even when they block its main program.', { arena: -1, rupture: 0.5 });
  L('s5', 'Breaking the law can be legitimate when large numbers of people do it openly to defend or win democratic gains, as in mass rent strikes or factory occupations.', { arena: 1 });
  HM('s6', 'In 1973 Salvador Allende\'s elected socialist government in Chile was overthrown in a military coup backed by the US.',
    'The most important reason Allende\'s government fell was that:', [
      O('It moved too fast without a stable majority and lost the middle classes.', { rupture: 1, arena: -1 }),
      O('It left the army and state apparatus intact and did not build popular power able to defend the government.', { rupture: -0.7, arena: 0.2 }),
      O('Relying on elections was wrong from the start; only an armed revolution could have succeeded.', { rupture: -1, arena: 1 }),
      O('US and domestic economic sabotage was too strong for any strategy to survive.', { rupture: 0.3, arena: -0.3 })
    ], { lefteuro: 1, eurocomm: [0, 3], ml: [1, 2], castro: 2, mzt: 2 });
  M('s7', 'In a country with free elections, where should socialist organizations put most of their effort today?', [
    O('Winning elections and passing legislation.', { rupture: 0.5, arena: -1 }),
    O('Elections, but mainly as a way to build unions, tenant groups and movements that can act independently.', { rupture: -0.3, arena: 0 }),
    O('Unions, tenant and community organizing and strikes, with elections a minor tactic.', { rupture: -0.3, arena: 0.6 }),
    O('Organizations of struggle that refuse electoral politics entirely.', { rupture: -0.7, arena: 1 }),
    O('Cooperatives, commons and alternative institutions people can live from now.', { rupture: 0.5, arena: 0.6 })
  ]);
  L('s8', 'A general strike that paralyzes the country is a legitimate way to bring down an elected government.', { arena: 1, rupture: -0.5 });
  L('s9', 'Socialists should join a government only if it will take measures that begin to break with capitalism, not just manage it better.', { rupture: -1 });
  M('s10', 'A strike wave and mass occupations push a left government to go further than its program. The government should:', [
    O('Restrain the movement to avoid a backlash and losing the center.', { rupture: 1, arena: -1, ctrl: 0 }),
    O('Use the pressure to justify going further, while keeping the movement within the law where possible.', { rupture: -0.3, arena: -0.3, ctrl: 0.2 }),
    O('Legalize what the movement has taken and give it formal powers, such as workers\' control of occupied firms.', { rupture: -0.6, arena: 0.3, ctrl: 0.8 }),
    O('Step aside: the movement\'s own councils should take power, not the government.', { rupture: -1, arena: 1, ctrl: 1 })
  ], { lefteuro: [2, 1], council: 3, ml: 1 });
  L('s11', 'Welfare-state reforms mostly stabilize capitalism rather than move society toward socialism.', { rupture: -1 },
    { lefteuro: 0, kautsky: -0.2, eurocomm: -0.8 });
  L('s12', 'Real social change mostly comes from pressure outside parliament; elected politicians follow rather than lead.', { arena: 1 });
  L('s13', 'Parliaments and elected local councils can become instruments of socialist transformation, not just platforms for propaganda.', { arena: -1, rupture: 0.2 });
  H('s14', 'In October 1917 the Bolsheviks took power in Russia through an insurrection organized by the soviets, without waiting for national elections.',
    'Taking power by insurrection was justified in the conditions of Russia in 1917.', { rupture: -1, arena: 0.5 },
    { lefteuro: 0.4, kautsky: -1, bernstein: -1, lux: 0.6, council: 0.3, ancom: -0.4, ansynd: -0.3, eurocomm: 0, demsoc: -0.2, socdem: -0.8, narod: 0.4, impossib: -0.8 });
  L('s15', 'Right now, defending what has already been won, like public services and labor rights, matters more than pushing beyond capitalism.', { rupture: 1 });

  /* ===== Organization: Party (-) / Self-organization (+) ===== */
  M('o1', 'What kind of organization does the left most need?', [
    O('A disciplined party of committed cadres with a single line, ready to lead when a crisis comes.', { org: -1 }),
    O('A mass party with internal tendencies and open debate, rooted in unions and movements.', { org: -0.3 }),
    O('A broad front of movements, unions and parties, with no single leading organization.', { org: 0.4 }),
    O('No parties: assemblies, councils and unions that people control directly.', { org: 1 })
  ]);
  L('o2', 'Once a party has decided its line by majority vote, members should carry it out in public even if they disagree.', { org: -1 });
  L('o3', 'Mass movements without a lasting organization, like the Gilets Jaunes or Chile\'s 2019 uprising, usually fade or get co-opted.', { org: -1 });
  L('o4', 'Workers learn what they need through their own struggles; political organizations should support those struggles rather than direct them.', { org: 1 });
  M('o5', 'A spontaneous uprising breaks out. Socialist organizations should:', [
    O('Try to win its leadership and give it a clear program and demands.', { org: -1 }),
    O('Join it, argue for their ideas in its assemblies, and accept its decisions.', { org: 0.2 }),
    O('Help it build its own lasting democratic structures without promoting any party.', { org: 0.8 }),
    O('Keep their distance unless it adopts a clear class program.', { org: -0.6 })
  ], { bordiga: 3, sparts: [3, 0], ml: 0, council: 2 });
  L('o6', 'People who devote their whole lives to political organizing are essential to any serious left.', { org: -1 });
  L('o7', 'Large organizations, however democratic their rules, end up run by a small leadership.', { org: 1 });
  H('o8', 'In 1904 Rosa Luxemburg argued that Lenin\'s centralized party model would stifle the initiative of the masses.',
    'History has mostly borne out Luxemburg\'s warning.', { org: 1, form: 0.3 },
    { lux: 1, ml: -1, hoxha: -1, mzt: -1, mlm: -1, orthotrot: -0.8, sparts: -1, grant: -0.8, council: 1, bordiga: -1, lefteuro: 0.4 });

  /* ===== The State: Wield (-) / Dismantle (+) ===== */
  M('st1', 'In a transition to socialism, what should happen to the existing state\'s ministries, courts, police and army?', [
    O('Keep them and put them under the control of an elected socialist government.', { state: -0.8, rupture: 0.6 }),
    O('Transform them gradually from inside and outside: democratize them while building new popular institutions alongside.', { state: -0.5, rupture: -0.2 }),
    O('Break them up and replace them with a new state based on workers\' councils.', { state: -1, rupture: -1 }),
    O('Dismantle them and organize society through federations of communities and workplaces, with no state at all.', { state: 1, rupture: -1 })
  ], { lefteuro: 1, ml: 2, lux: 2, council: 2, eurocomm: [1, 0] });
  L('st2', 'Any state, including one run by workers, develops interests of its own that conflict with the people it governs.', { state: 1 });
  L('st3', 'A socialist society will need courts, police and an army of some kind for as long as capitalist states exist elsewhere.', { state: -1 });
  H('st4', 'In 1921 sailors at the Kronstadt naval base, earlier praised as heroes of the revolution, rebelled against the Bolshevik government and demanded freely elected soviets. The Red Army crushed the rebellion.',
    'The Bolshevik government was justified in suppressing the Kronstadt rebellion.', { state: -1, form: -1 },
    { ml: 1, hoxha: 1, poststalin: 0.8, orthotrot: 0.8, sparts: 1, grant: 0.7, cliff: 0.3, shacht: -0.4, moreno: 0.6, pablo: 0.5, council: -1, bordiga: 0.4, lux: -0.5, libmarx: -1, ancom: -1, ansynd: -1, lefteuro: -0.4, autog: -0.8 });
  H('st5', 'In the First International (1864-1876), Marx and Bakunin split over whether workers should win political power before the state could be abolished.',
    'Marx was right against Bakunin: the working class has to win political power before the state can wither away.', { state: -1 },
    { ancom: -1, ansynd: -1, collectivist: -1, platform: -1, insurrect: -1, synthesis: -1, mutualism: -1, socialeco: -0.8, demconf: -0.4, christanarch: -1, libmarx: 0.6, council: 0.4, operaismo: 0.4, autonomism: 0.1, postop: -0.2, communization: 0, situ: 0.2, lux: 1, zapat: -0.6, autog: 0.3, lefteuro: 0.8 });
  L('st6', 'Public services like health and education should be run by the people who work in and use them, not by a central government department.', { state: 0.6, ctrl: 0.6 }, null, { autog: 1 });
  L('st7', 'A strong central state will be needed to carry out a fast transition away from fossil fuels.', { state: -1 });
  L('st8', 'Even after capitalism, some central authority will be needed to coordinate large-scale decisions across society.', { state: -1 });

  /* ===== Political Form: Proletarian Dictatorship (-) / Pluralism (+) ===== */
  M('f1', 'A left government has socialized the main industries. Then a pro-capitalist party wins a national election. What should happen?', [
    O('It takes office with full powers, including to reverse the socializations.', { form: 1 }),
    O('It takes office, but socialized property and workers\' councils are protected by constitutional guarantees a simple majority cannot overturn.', { form: 0.5 }),
    O('Elections continue, but parties that aim to restore capitalism are not allowed to take power.', { form: -0.5 }),
    O('Elections of this kind should not exist; power rests with the councils and the revolutionary party.', { form: -1 })
  ], { lefteuro: 1, eurocomm: [0, 1], socdem: 0, demsoc: [1, 0], ml: 3 });
  L('f2', 'Opposition parties, including pro-capitalist ones, should be free to organize and publish during a transition to socialism.', { form: 1 });
  L('f3', 'During a civil war or foreign invasion, a revolutionary government is right to suspend elections and ban hostile parties.', { form: -1 });
  L('f4', 'Under socialism, workers must keep the right to strike, including against a socialist government.', { form: 1 });
  H('f5', 'In January 1918 the Bolsheviks dissolved the Constituent Assembly, an elected body in which the Socialist Revolutionaries held the most seats.',
    'Dissolving the Constituent Assembly was the right decision.', { form: -1 },
    { lux: -0.8, kautsky: -1, orthotrot: 1, cliff: 0.8, grant: 1, bordiga: 1, council: 0.3, narod: -1, ancom: 0, communization: 0, libmarx: -0.2, lefteuro: -0.6 });
  M('f6', 'How should a socialist society be governed?', [
    O('Multiparty parliamentary democracy, much as today.', { form: 1 }),
    O('Parliamentary democracy combined with strong councils in workplaces and neighborhoods.', { form: 0.6 }),
    O('A system of elected councils with competing parties, but no parliament.', { form: 0.1 }),
    O('Councils and assemblies with no parties at all.', { form: 0.3 }),
    O('Rule by a single party representing the working class, with debate inside it.', { form: -1 })
  ], { lefteuro: 1, autog: [1, 3], council: [2, 3], ancom: 3, ansynd: 3, orthotrot: 2, ml: 4, socdem: 0, eurocomm: [1, 0], demsoc: [1, 0], lux: 2 });
  L('f7', 'Freedom of speech should protect people who argue for capitalism, even in a socialist society.', { form: 1 });
  L('f8', 'A left government defending itself may legitimately restrict media owned by large corporations or foreign governments.', { form: -1 });

  /* ===== Coordination: Planning (-) / Market (+) ===== */
  M('c1', 'In a socialist economy, how should everyday goods like clothing, phones and food be distributed?', [
    O('Mostly through markets, with prices set by supply and demand between socially owned firms.', { coord: 1 }),
    O('Markets for most consumer goods, with planning for investment, housing, energy and transport.', { coord: 0.3 }),
    O('A democratic plan, with prices used only as signals that planners can override.', { coord: -0.5 }),
    O('Directly according to need, without prices or money.', { coord: -1 })
  ]);
  L('c2', 'Without market prices there is no reliable way to know what things cost or what people want.', { coord: 1 });
  H('c3', 'From 1978 China introduced markets, private enterprise and foreign investment while the Communist Party kept power. The economy grew rapidly and hundreds of millions left extreme poverty.',
    'China\'s market reforms were a legitimate strategy for building socialism.', { coord: 1 },
    { deng: 1, ml: 0, poststalin: -0.2, hoxha: -1, mzt: -1, mlm: -1, gonzalo: -1, naxal: -1, avakian: -1, mtw: -0.6, prachanda: 0, sparts: -0.6, orthotrot: -0.8, cliff: -1, hochiminh: 0.7, juche: -0.3, tito: 0.4, castro: 0, reformcomm: 0.3, marketsoc: 0.3, bolivar: 0.4, cyber: -0.8, bordiga: -1, council: -1, lefteuro: -0.6 });
  L('c4', 'Competition between firms remains useful under socialism, as long as the firms are owned by their workers or the public.', { coord: 1 });
  L('c5', 'Money will still be needed in a fully communist society.', { coord: 1 });
  L('c6', 'Small private businesses, such as family shops and restaurants, should be allowed under socialism.', { coord: 0.8, cap: 0.2 },
    { deng: 1, tito: 0.6, castro: -0.4, hochiminh: 0.5 });
  M('c7', 'Soviet central planning ran into trouble mainly because:', [
    O('Planning without markets cannot handle the information a modern economy produces.', { coord: 1, verdict: 0.4 }),
    O('It was bureaucratic and undemocratic; democratic planning would work.', { coord: -0.6, verdict: 0.7 }),
    O('It didn\'t fail; it industrialized the country and was dismantled by political choices.', { coord: -1, verdict: -1 }),
    O('It lacked the computing power that now makes planning workable.', { coord: -1, verdict: 0.1 }, { accel: 1 })
  ], { cyber: 3, parecon: 1, marketsoc: 0, ml: 2 });
  L('c8', 'Decisions about large investments, like where to build factories and which industries to expand, should be made by democratic planning bodies rather than private investors or market signals.', { coord: -1 });

  /* ===== Control: State Ownership (-) / Self-Management (+) ===== */
  M('k1', 'Under socialism, who should run a large hospital?', [
    O('Managers appointed by the health ministry, answerable to the elected government.', { ctrl: -1 }),
    O('A board shared between the ministry, staff and patients\' representatives.', { ctrl: 0 }),
    O('Its staff, through an elected council, within a national health plan.', { ctrl: 0.6 }),
    O('Its staff and the community it serves, through assemblies, with no ministry above them.', { ctrl: 1 }, { autog: 1 })
  ]);
  L('k2', 'Nationalizing the major industries is the key step in building socialism.', { ctrl: -1 },
    { communization: -1, bordiga: -0.3 });
  L('k3', 'A socialist enterprise can be run by a single appointed director if that makes it more efficient.', { ctrl: -1 });
  H('k4', 'After breaking with Stalin in 1948, Yugoslavia built an economy of worker-managed firms that traded with each other on markets.',
    'Yugoslav self-management came closer to real socialism than the Soviet model of state ownership.', { ctrl: 1, coord: 0.3 },
    { tito: 1, ml: -1, hoxha: -1, poststalin: -0.6, deng: 0, council: -0.2, bordiga: -1, communization: -1, cliff: 0, econdem: 1, marketsoc: 0.6, reformcomm: 0.6, autog: 0.6, lefteuro: 0.4 });
  L('k5', 'Self-management should reach beyond the workplace to housing estates, schools and neighborhoods.', { ctrl: 0.6, state: 0.3 }, null, { autog: 1 });
  L('k6', 'Economic decisions are best made by trained experts and planners rather than by votes in the workplace.', { ctrl: -1 });
  M('k7', 'Workers occupy a factory its owners plan to close. What should happen to it?', [
    O('The state nationalizes it and appoints new management.', { ctrl: -1, coord: -0.5 }),
    O('The state nationalizes it and the workers elect the management.', { ctrl: 0.4, coord: -0.3 }),
    O('The workers run it as a cooperative, with public loans.', { ctrl: 0.8, coord: 0.5 }),
    O('The workers run it and link up with other occupied workplaces to coordinate production outside the market.', { ctrl: 1, coord: -0.7 })
  ]);
  L('k8', 'Elected workers\' councils, not a government ministry, should have the final say over national economic decisions.', { ctrl: 1, state: 0.3 });

  /* ===== Scope: National Path (-) / World Revolution (+) ===== */
  L('w1', 'Socialism can be fully built in one country, even if capitalism survives in the rest of the world.', { scope: -1 });
  M('w2', 'A country that has broken with capitalism should make its first priority:', [
    O('Its own economic development and defense.', { scope: -1 }),
    O('Its own development, while giving material support to movements abroad.', { scope: -0.2 }),
    O('Spreading the revolution, since it cannot survive alone for long.', { scope: 1 })
  ]);
  L('w3', 'Each country has to find its own road to socialism, shaped by its own history and culture.', { scope: -1, nat: 0.3 });
  H('w4', 'In 1943 Stalin dissolved the Communist International, which coordinated communist parties worldwide, partly to reassure his wartime allies.',
    'Dissolving the Communist International was a betrayal of internationalism.', { scope: 1 },
    { ml: -0.6, poststalin: -0.6, hoxha: -0.5, mzt: -0.3, orthotrot: 1, sparts: 1, grant: 1, pablo: 1, moreno: 1, cliff: 1, posad: 1, eurocomm: -0.6, lefteuro: -0.2 });
  L('w5', 'Workers in different countries have more in common with each other than with the employers of their own nation.', { scope: 1, nat: -0.3 });
  L('w6', 'Patriotism can be a positive force for the left.', { scope: -1, nat: 0.4, soc: 0.3 });
  L('w7', 'A left government in a European country should be willing to break with the EU and its treaties to carry out its program.', { scope: -0.6, rupture: -0.4 });
  L('w8', 'The labor movement should organize mainly across borders, through international unions and coordinated strikes, rather than through national politics.', { scope: 1, arena: 0.3 });

  /* ===== Geopolitics: Campism (-) / Third Camp (+) ===== */
  M('g1', 'A government hostile to the US but repressive at home, such as Iran\'s, faces mass protests. Western socialists should:', [
    O('Avoid backing the protests, since that helps US efforts at regime change.', { geo: -1 }),
    O('Oppose Western sanctions and intervention, and say little about the protests.', { geo: -0.5 }),
    O('Oppose Western intervention and support the protesters\' own democratic and labor demands.', { geo: 0.6 }),
    O('Back the protesters fully, including calls for stronger Western pressure on the government.', { geo: 1 })
  ], { shacht: 3, cliff: 2, lux: 2, council: 2 });
  L('g2', 'Socialists should oppose every ruling class equally, whether it is aligned with Washington or against it.', { geo: 1 });
  H('g3', 'In 2022 Russia launched a full-scale invasion of Ukraine.',
    'The invasion was mainly a response to NATO expansion, and Western socialists should focus their criticism on NATO.', { geo: -1 },
    { hoxha: 0, gonzalo: -0.8, mlm: -0.5 });
  L('g4', 'China today is an imperialist power.', { geo: 1 },
    { deng: -1, ml: -0.6, poststalin: -0.6, hoxha: 1, gonzalo: 1, mlm: 1, avakian: 1, mtw: 0, sparts: -1, orthotrot: -0.4, posad: -0.6, cliff: 1, bolivar: -1, juche: -0.6 });
  L('g5', 'A multipolar world, with several competing great powers, is better for the global working class than one dominated by the US.', { geo: -1 });
  L('g6', 'Socialists should support Western military aid to a country resisting invasion, even though Western governments are imperialist.', { geo: 1, rupture: 0.4 },
    { cliff: -0.3, lux: -0.6, council: -1, bordiga: -1, impossib: -1, communization: -1, sparts: -1, ml: -1, ancom: -0.2, shacht: 1, socdem: 1, demsoc: 0.5 });
  L('g7', 'Socialists in the West should mainly criticize their own governments\' foreign policy rather than the governments of rival powers.', { geo: -1 },
    { lux: 0.8, council: 0.4, cliff: 0.4, bordiga: 0.6, impossib: 0 });
  L('g8', 'The rise of Russia and China is a positive development because it limits US power.', { geo: -1 });

  /* ===== Historical Verdict: Defense (-) / Critique (+) ===== */
  M('v1', 'Which description of the Soviet Union under Stalin comes closest to your view?', [
    O('A socialist society that made real achievements against enormous odds.', { verdict: -1 }),
    O('A workers\' state deformed by a bureaucracy, still worth defending against capitalism.', { verdict: 0 }),
    O('An attempt at socialism that went badly wrong, which socialists should learn from.', { verdict: 0.5 }),
    O('State capitalism or a new class society, with the bureaucracy as its ruling class.', { verdict: 1 })
  ], { orthotrot: 1, grant: 1, sparts: 1, pablo: 1, moreno: 1, posad: 1, cliff: 3, shacht: 3, council: 3, bordiga: 3, lefteuro: 2, eurocomm: 2, ml: 0, hoxha: 0 });
  H('v2', 'Between 1936 and 1938 the Soviet government arrested around 1.5 million people and executed roughly 680,000 in the Great Purge, including most of the original Bolshevik leadership.',
    'Western accounts have greatly exaggerated the scale and injustice of the purges.', { verdict: -1 },
    { orthotrot: -1, sparts: -1, grant: -1, posad: -1, poststalin: -0.6, reformcomm: -1, deng: -0.2 });
  H('v3', 'In 1956 Hungarian workers and students rose against their Communist government and formed workers\' councils. Soviet troops crushed the uprising.',
    'The Soviet intervention in Hungary was necessary to protect socialism.', { verdict: -1, form: -0.3 },
    { tito: 0, hoxha: 1, mzt: 1, orthotrot: -1, grant: -0.8, pablo: -1, sparts: -0.3, eurocomm: -0.6, lefteuro: -1, reformcomm: -1 });
  L('v4', 'Cuba shows what socialism can achieve in a poor country.', { verdict: -1, geo: -0.3 },
    { castro: 1, cliff: -1, shacht: -1, sparts: 0.6, pablo: 0.6, posad: 0.6, orthotrot: 0, bolivar: 1, mlm: -0.4, hoxha: -0.6 });
  L('v5', 'Socialists today should openly condemn the repression carried out by past socialist governments.', { verdict: 1, form: 0.3 });
  M('v6', 'Taken together, the 20th-century socialist states were:', [
    O('Real achievements to defend, despite their mistakes.', { verdict: -1 }),
    O('A mix: real social gains, but political systems socialists should reject.', { verdict: 0.3 }),
    O('Distortions of socialism that matter mainly as warnings.', { verdict: 0.8 }),
    O('Not socialist at all; capitalist societies under another name.', { verdict: 1 })
  ]);
  L('v7', 'Western accounts of the famines under Stalin and Mao are exaggerated for political reasons.', { verdict: -1 });
  L('v8', 'The collapse of the Soviet Union in 1991 was a defeat for the world working class.', { verdict: -1 },
    { orthotrot: 0.8, sparts: 1, grant: 0.7, cliff: -0.6, shacht: -0.8, council: -0.8, bordiga: -0.6, reformcomm: 0.3, lefteuro: 0.2, socdem: -0.6, eurocomm: 0 });

  /* ===== Technology & Growth: Accelerate (-) / Restrain (+) ===== */
  M('e1', 'Under socialism, AI and automation should be:', [
    O('Developed as fast as possible to replace most human labor.', { tech: -1 }, { accel: 1 }),
    O('Developed steadily under democratic control, with workers deciding how they are used on the job.', { tech: -0.3 }),
    O('Restricted to uses with clear social benefit, with much current development halted.', { tech: 0.6 }, { skeptic: 1 }),
    O('Scaled back in favor of human skill and smaller-scale technology.', { tech: 1 }, { skeptic: 1 })
  ]);
  L('e2', 'Economic growth in rich countries must be deliberately reduced to stay within ecological limits.', { tech: 1 }, null, { degrowth: 1 });
  L('e3', 'Expanding productive capacity as fast as possible is the material basis for communism.', { tech: -1 });
  L('e4', 'Nuclear power should be a major part of a socialist energy system.', { tech: -1 });
  L('e5', 'Working classes in rich countries will have to accept lower material consumption in a just ecological transition.', { tech: 1, scope: 0.2 },
    { mtw: 1 }, { degrowth: 1 });
  L('e6', 'Technology developed under capitalism is shaped by capitalist aims; a socialist society would have to redesign it, not just take it over.', { tech: 1 },
    { operaismo: 0.8, autonomism: 0.6, gandhian: 1, communization: 0.6, situ: 0.6, ml: -0.6, deng: -1, cyber: -0.8 }, { skeptic: 1 });
  L('e7', 'Advanced AI poses risks serious enough that its development should be slowed or paused.', { tech: 1 },
    { accel: -1, cyber: -0.8, deng: -1, degrowth: 0.6 }, { skeptic: 1, accel: -1 });
  M('e8', 'Warehouse workers face AI systems that set their pace and track every movement. Their union should:', [
    O('Accept the systems in exchange for a share of the productivity gains and shorter hours.', { tech: -0.8 }, { accel: 1 }),
    O('Win control: the union approves how the algorithms are used and gets access to the data.', { tech: 0 }),
    O('Fight to ban algorithmic management outright.', { tech: 0.8 }, { skeptic: 1 })
  ]);

  /* ===== Class & Oppression: Class Primacy (-) / Intersectional (+) ===== */
  M('i1', 'How do racism and sexism relate to capitalism?', [
    O('They are mainly tools that divide workers, and would largely fade once capitalism ends.', { opp: -1 }),
    O('Capitalism depends on them structurally, so fighting them is part of fighting capitalism.', { opp: 0.2 }),
    O('They are systems of oppression with their own histories, bound up with capitalism but not reducible to it.', { opp: 0.7 }),
    O('They are older and deeper than capitalism; class is one oppression among several.', { opp: 1 })
  ]);
  L('i2', 'Politics organized around identity distracts from class struggle.', { opp: -1 });
  M('i3', 'A socialist organization\'s public campaigning should focus on:', [
    O('Universal class demands that unite all workers, like jobs, wages and healthcare.', { opp: -1 }),
    O('Universal demands, framed to show how they help particular oppressed groups.', { opp: 0 }),
    O('Class demands together with explicit demands against racism, sexism and homophobia.', { opp: 0.6 }),
    O('Supporting autonomous organizations of oppressed groups, allied with labor.', { opp: 1 })
  ]);
  L('i4', 'Unpaid domestic and care work, mostly done by women, is as central to capitalism as wage labor.', { opp: 1 },
    { autonomism: 1 }, { fem: 1 });
  L('i5', 'Movements organized around race, gender or sexuality can be revolutionary forces in their own right, not only as part of the workers\' movement.', { opp: 1 });
  L('i6', 'Organized workers in industry, logistics and other strategic sectors remain the decisive force for socialist change.', { opp: -1 },
    { postop: -1, mtw: -0.6, mzt: -0.3, naxal: -0.5, gonzalo: -0.2 });
  L('i7', 'Reparations for slavery and colonialism should be part of a socialist program.', { opp: 0.8 },
    { mtw: 1, cabral: 1, sankara: 0.6 }, { race: 1 });
  L('i8', 'The nuclear family is a product of class society that socialists should aim to move beyond.', { soc: -1, opp: 0.4 },
    { autonomism: 0.6, ancom: 0.6, juche: -1, leftcon: -1, islamic: -1 }, { queer: 1, fem: 0.5 });

  /* ===== Capitalism: Abolish (-) / Retain (+) ===== */
  L('cap1', 'Private ownership of large companies should be abolished.', { cap: -1 });
  L('cap2', 'A well-regulated capitalism with a strong welfare state is the best realistic economic system.', { cap: 1 },
    { socdem: 0.4 });
  L('cap3', 'The profit motive is compatible with a fair society if it is properly taxed and regulated.', { cap: 1 },
    { deng: 0.3, socdem: 0.5, mutualism: -0.4, marketsoc: 0 });
  L('cap4', 'Breaking up large corporations to restore competition between smaller firms is the best way to curb corporate power.', { cap: 0.5, coord: 0.5 },
    { progpop: 1, soclib: 0.3, socdem: -0.3, demsoc: -0.4, mutualism: 0.6, leftpop: 0, marketsoc: -0.2, ml: -1, deng: -0.6 });

  /* ===== Religion ===== */
  L('rel1', 'My own commitment to socialism is grounded in religious faith.', { rel: 1 });
  L('rel2', 'Religion is, on balance, an obstacle to human liberation that socialists should work to overcome.', { rel: -1 });
  L('rel3', 'The teachings of Jesus, the Prophet Muhammad or other religious figures contain a call for economic equality that socialists should embrace.', { rel: 1 });

  /* ===== Means: Armed Struggle (-) / Nonviolence (+) ===== */
  M('nv1', 'In a country with free elections, which methods are legitimate for the left? Choose the furthest you would go.', [
    O('Only legal methods: elections, lawful protest and strikes.', { nv: 1, arena: -1 }),
    O('Also open, nonviolent civil disobedience, like occupations and blockades.', { nv: 0.7, arena: 0.2 }),
    O('Also damage to property and sabotage.', { nv: -0.3, arena: 0.6 }),
    O('Also armed self-defense against police or paramilitary attack.', { nv: -0.7, arena: 0.8 }),
    O('Also armed struggle to take power.', { nv: -1, arena: 1 })
  ], { lefteuro: 1, ecolen: 2, insurrect: [2, 3], christanarch: 1, gandhian: 1 });
  L('nv2', 'Armed struggle can be a legitimate means of ending capitalism.', { nv: -1 });
  L('nv3', 'Socialists should stay nonviolent even if their opponents use violence against them.', { nv: 1 });

  /* ===== Social values: Progressive (-) / Traditional (+) ===== */
  L('soc1', 'Traditional family structures should be protected and supported by a socialist state.', { soc: 1 });
  L('soc2', 'Strict limits on immigration protect workers\' wages and should be supported by socialists.', { soc: 1, scope: -0.3 });
  L('soc3', 'Socialist politics should openly champion LGBTQ rights.', { soc: -1, opp: 0.3 }, null, { queer: 1 });

  /* ===== National question: Anti-nationalist (-) / National Liberation (+) ===== */
  L('nat1', 'Oppressed nations have the right to self-determination, including the right to form their own state.', { nat: 1 },
    { ml: 0.8, lux: -1, bordiga: -0.6, council: -1 });
  L('nat2', 'Nationalism, even the nationalism of oppressed peoples, divides the working class and should be opposed.', { nat: -1 });
  L('nat3', 'National minorities should have cultural autonomy, with their own schools and institutions wherever they live, rather than a separate territory.', { nat: 0.3 },
    { austro: 1, ml: -0.6, orthotrot: -0.4, lux: -0.2 });

  /* ===== Liberation politics ===== */
  L('fem1', 'Housework, childcare and care for the sick and elderly should be collectivized and socially funded under socialism.', { opp: 0.5 },
    { autonomism: 1, ml: 0.6, demconf: 1 }, { fem: 1 });
  L('race1', 'Capitalism developed through slavery and colonialism, and racism is built into its structure.', { opp: 0.6 },
    { mtw: 1, cabral: 1 }, { race: 1 });
  L('ind1', 'Indigenous peoples\' collective land rights and self-government should take priority over national development plans.', { opp: 0.5, tech: 0.5, nat: 0.4 },
    { mariategui: 1, zapat: 1, ml: -0.5, deng: -1, bolivar: -0.2, castro: -0.2, naxal: 0.8, gandhian: 0.3, sankara: 0.3, nkrumah: -0.6 }, { ind: 1 });
  L('ind2', 'Precolonial communal traditions offer a model for socialism today.', { ctrl: 0.3 },
    { ujamaa: 1, mariategui: 1, zapat: 1, cabral: 0.6, narod: 0.8, nkrumah: 0.4, gandhian: 0.6, ml: -0.6, kautsky: -0.8, bordiga: -1, deng: -0.6 }, { ind: 1 });

  /* ===== Autogestion: self-management beyond the workplace ===== */
  L('ag1', 'Residents should collectively decide how their city\'s land, housing and public space are used: a right to the city, not just a right to housing.', { ctrl: 0.6, state: 0.3 }, null, { autog: 1 });
  L('ag2', 'Tenants should collectively manage the buildings they live in, including rents and maintenance.', { ctrl: 0.7 }, null, { autog: 1 });
  M('ag3', 'Who should decide how a neighborhood is redeveloped?', [
    O('The elected city government, advised by professional planners.', { ctrl: -0.6 }, { autog: -1 }),
    O('The city government, but with binding votes by residents\' assemblies on major projects.', { ctrl: 0.3 }, { autog: 0.5 }),
    O('Residents\' assemblies, with the city government carrying out their decisions.', { ctrl: 1 }, { autog: 1 })
  ]);
  L('ag4', 'Self-management means more than workers\' control: it should extend to schools, universities, care services and the use of free time.', { ctrl: 0.6, state: 0.3 }, null, { autog: 1 });

  /* ===== Technology and AI ===== */
  L('ai1', 'AI systems built by private corporations should be brought under public ownership.', { ctrl: -0.5, cap: -0.5 });
  L('ai2', 'AI-assisted planning could solve the information problems that undermined Soviet central planning.', { coord: -1, tech: -1 },
    { cyber: 1, parecon: -0.2, marketsoc: -0.6, degrowth: -0.3, gandhian: -1 }, { accel: 1 });
  L('ai3', 'Software, data and digital infrastructure should be shared as a commons, free for anyone to use and modify.', { ctrl: 0.5 },
    { platcoop: 1, accel: 0.6, postop: 1, ancom: 0.8 }, { commons: 1 });
  L('ai4', 'Platforms like Uber and Amazon should be replaced by cooperatives owned by their workers and users.', { ctrl: 1, coord: 0.3 },
    { platcoop: 1, coop: 1, econdem: 0.8 }, { commons: 1 });
  L('ai5', 'Workers are right to resist new technologies that destroy their jobs or strip the skill out of their work, as the Luddites did.', { tech: 1 },
    { ml: -0.6, deng: -1, accel: -1, cyber: -0.8, operaismo: 0.6, autonomism: 0.6, insurrect: 0.8, gandhian: 1 }, { skeptic: 1 });
  L('ai6', 'A universal basic income is a good socialist response to automation.', { rupture: 0.4, tech: -0.4 },
    { postop: 1, accel: 1, autonomism: 0.8, ml: -0.8, bordiga: -1, kautsky: -0.5, parecon: -0.5, cyber: -0.6, impossib: -1, grant: -0.5, deng: -0.6 }, { accel: 0.5 });
})(typeof globalThis !== 'undefined' ? globalThis : window);
