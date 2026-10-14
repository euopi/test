/* Part 1 items, answered by everyone.
   l   = loadings: agreeing (or choosing option B) moves you toward the + pole.
   x   = hand-set expected answers (-1..1) for tendencies whose doctrine is
         specific on this question; these override the profile-derived value.
   tag = tag scores this answer feeds (sign gives direction). */
(function (G) {
  var TA = (G.TA = G.TA || {});
  var I = (TA.items = TA.items || []);
  function L(id, q, l, x, tag) { I.push({ id: id, part: 'core', t: 'l', q: q, l: l, x: x || null, tag: tag || null }); }
  function H(id, ctx, q, l, x, tag) { I.push({ id: id, part: 'core', t: 'l', h: 1, ctx: ctx, q: q, l: l, x: x || null, tag: tag || null }); }
  function C(id, q, a, b, l, x, tag) { I.push({ id: id, part: 'core', t: 'c', q: q, opts: [a, b], l: l, x: x || null, tag: tag || null }); }

  /* 1. Path: Revolution (-) / Reform (+) */
  L('p1', 'Capitalism can be replaced by socialism through elections and legislation, without a revolutionary break.', { path: 1 },
    { impossib: 0.6, deleon: 0.6 });
  L('p2', 'Even a socialist party that wins a parliamentary majority will eventually have to confront the army, the courts and the civil service by force.', { path: -1 });
  C('p3', 'In a capitalist democracy, the main work of socialists should be:',
    'Building the forces for an eventual revolutionary seizure of power',
    'Winning reforms and elections that move society step by step toward socialism', { path: 1 },
    { impossib: -0.6, bordiga: -1 });
  H('p4', 'In 1973 the elected socialist government of Salvador Allende in Chile was overthrown in a US-backed military coup.',
    'The main lesson of Chile 1973 is that the electoral road to socialism cannot work.', { path: -1 });
  L('p5', 'Reforms won under capitalism, such as public healthcare or a minimum wage, are real steps toward socialism rather than concessions that stabilize capitalism.', { path: 1 },
    { impossib: -1, bordiga: -1, communization: -1, council: -0.8, kautsky: 0.3, lux: -0.3 });
  L('p6', 'Socialists should be willing to join coalition governments with non-socialist parties.', { path: 1, form: 0.3 },
    { impossib: -1, bordiga: -1, council: -1, sparts: -1, lux: -0.6, kautsky: -0.4, eurocomm: 1, prachanda: 0.6 });
  L('p7', 'If a general strike paralyzed the country and the government lost control of the army, socialists should try to take power directly rather than wait for new elections.', { path: -1 });

  /* 2. Organization: Vanguard (-) / Spontaneity (+) */
  L('o1', 'Left to its own experience, the working class develops only trade-union consciousness. Socialist consciousness has to be brought to it by organized revolutionaries.', { org: -1 });
  L('o2', 'A revolutionary party should work by democratic centralism: open debate before a decision, then full unity in carrying it out.', { org: -1 });
  C('o3', 'Who should lead a revolution?',
    'A disciplined party made up of the most class-conscious workers',
    'The mass organizations of the class itself, such as councils, assemblies and unions, with no party in command', { org: 1 });
  L('o4', 'Uprisings that began without party leadership, like the Paris Commune of 1871 or the Russian soviets of 1905, show that workers create their own revolutionary institutions.', { org: 1 });
  L('o5', 'Any party that claims to lead the working class will end up substituting itself for the class.', { org: 1 });
  H('o6', 'In 1902 Lenin argued for a centralized party of professional revolutionaries. In 1904 Rosa Luxemburg replied that this would stifle the initiative of the masses.',
    'On the whole, Luxemburg had the better argument.', { org: 1, form: 0.3 },
    { lux: 1, ml: -1, hoxha: -1, mzt: -1, mlm: -1, orthotrot: -0.8, sparts: -1, grant: -0.8, council: 1, bordiga: -1 });
  L('o7', 'Socialists should build a single, tightly organized party rather than loose networks or federations of groups.', { org: -1 });

  /* 3. The State: Workers' State (-) / Abolition (+) */
  L('s1', 'After a revolution, the working class needs its own state, with an army and police, to defend itself against counter-revolution.', { state: -1 });
  L('s2', 'Any state, even one run by workers, will produce a new ruling class of officials.', { state: 1 });
  C('s3', 'After capitalism is overthrown, the state should:',
    'Be taken over and used by workers until classes disappear, then wither away',
    'Be dismantled immediately and replaced by free federations of communities and workplaces', { state: 1 });
  H('s4', 'In 1921 sailors at the Kronstadt naval base, earlier praised as heroes of the revolution, rebelled against the Bolshevik government and demanded freely elected soviets. The Red Army crushed the rebellion.',
    'The Bolshevik government was justified in suppressing the Kronstadt rebellion.', { state: -1, form: -1 },
    { ml: 1, hoxha: 1, poststalin: 0.8, orthotrot: 0.8, sparts: 1, grant: 0.7, cliff: 0.3, shacht: -0.4, moreno: 0.6, pablo: 0.5, council: -1, bordiga: 0.4, lux: -0.5, libmarx: -1, ancom: -1, ansynd: -1 });
  L('s5', 'A socialist society will still need a professional standing army as long as capitalist states exist elsewhere.', { state: -1, scope: -0.3 });
  L('s6', 'The state is not just a tool of the capitalist class. Its hierarchy is itself a form of domination that must end along with capitalism.', { state: 1 });
  H('s8', 'In the First International (1864-1876), Marx and Bakunin split over whether workers should win political power before the state could be abolished.',
    'Marx was right against Bakunin: the working class has to win political power before the state can wither away.', { state: -1 },
    { ancom: -1, ansynd: -1, collectivist: -1, platform: -1, insurrect: -1, synthesis: -1, mutualism: -1, socialeco: -0.8, demconf: -0.4, christanarch: -1, libmarx: 0.6, council: 0.4, operaismo: 0.4, autonomism: 0.1, postop: -0.2, communization: 0, situ: 0.2, lux: 1, zapat: -0.6 });
  L('s7', 'Socialists should aim to control a centralized state powerful enough to direct the whole economy.', { state: -1, ctrl: -0.5 });

  /* 4. Political Form: Proletarian Dictatorship (-) / Pluralism (+) */
  L('f1', 'After a revolution, parties that oppose socialism should still be free to organize and run in elections.', { form: 1 });
  L('f2', 'During the transition to socialism, a single party should hold power, since rival parties would become vehicles for counter-revolution.', { form: -1 },
    { council: -0.6, ancom: -1 });
  L('f3', 'Freedom of the press should be protected even for newspapers that call for restoring capitalism.', { form: 1 });
  C('f4', 'If a socialist government lost a free election to a pro-capitalist party, it should:',
    'Refuse to hand over power, since the revolution cannot be voted away',
    'Hand over power and fight to win the next election', { form: 1 });
  H('f5', 'In January 1918 the Bolsheviks dissolved the Constituent Assembly, an elected body in which the Socialist Revolutionaries held the most seats.',
    'Dissolving the Constituent Assembly was the right decision.', { form: -1 },
    { lux: -0.8, kautsky: -1, orthotrot: 1, cliff: 0.8, grant: 1, bordiga: 1, council: 0.3, narod: -1, ancom: 0, communization: 0, libmarx: -0.2 });
  L('f6', 'Civil liberties like free speech and assembly are "bourgeois freedoms" whose value depends on which class they serve.', { form: -1 });
  L('f7', 'Under socialism, workers must keep the right to strike, including against a socialist government.', { form: 1 });

  /* 5. Coordination: Planning (-) / Market (+) */
  L('c1', 'Markets should continue to allocate most consumer goods under socialism, with firms owned socially rather than by capitalists.', { coord: 1 });
  L('c2', 'Production should be planned in advance according to human needs rather than coordinated by prices and profit.', { coord: -1 });
  C('c3', 'The best way to coordinate a socialist economy is:',
    'A democratic plan that decides in advance what gets produced',
    'Markets between worker-run or publicly owned firms', { coord: 1 });
  L('c4', 'Money should be abolished in a fully communist society.', { coord: -1 });
  H('c5', 'From 1978 China introduced markets, private enterprise and foreign investment while the Communist Party kept power. The economy grew rapidly and hundreds of millions left extreme poverty.',
    'China\'s market reforms were a legitimate strategy for building socialism.', { coord: 1 },
    { deng: 1, ml: 0, poststalin: -0.2, hoxha: -1, mzt: -1, mlm: -1, gonzalo: -1, naxal: -1, avakian: -1, mtw: -0.6, prachanda: 0, sparts: -0.6, orthotrot: -0.8, cliff: -1, hochiminh: 0.7, juche: -0.3, tito: 0.4, castro: 0, reformcomm: 0.3, marketsoc: 0.3, bolivar: 0.4, cyber: -0.8, bordiga: -1, council: -1 });
  L('c6', 'Modern computing makes it possible to plan an entire economy efficiently without markets.', { coord: -1, tech: -0.5 },
    { cyber: 1, parecon: 0.3, marketsoc: -1, econdem: -0.8, mutualism: -1 });
  L('c7', 'Small private businesses, such as family shops and restaurants, should be allowed under socialism.', { coord: 0.8, cap: 0.2 },
    { deng: 1, tito: 0.6, castro: -0.4, hochiminh: 0.5 });

  /* 6. Control: State Ownership (-) / Self-Management (+) */
  L('k1', 'Workplaces should be run by the people who work in them, through elected councils or assemblies, rather than by managers appointed by the state.', { ctrl: 1 });
  L('k2', 'Nationalizing the major industries is the key step in building socialism.', { ctrl: -1 },
    { communization: -1, bordiga: -0.3 });
  C('k3', 'Under socialism, who should decide how a steel mill is run?',
    'A central economic ministry, coordinating the mill with the rest of the economy',
    'The mill\'s workers, through their own elected council', { ctrl: 1 });
  L('k4', 'One-person management, with a single appointed director in charge of a factory, is acceptable under socialism if it improves efficiency.', { ctrl: -1 });
  H('k5', 'After breaking with Stalin in 1948, Yugoslavia built an economy of worker-managed firms that traded with each other on markets.',
    'Yugoslav self-management was closer to real socialism than the Soviet model of state ownership.', { ctrl: 1, coord: 0.3 },
    { tito: 1, ml: -1, hoxha: -1, poststalin: -0.6, deng: 0, council: -0.2, bordiga: -1, communization: -1, cliff: 0, econdem: 1, marketsoc: 0.6, reformcomm: 0.6 });
  L('k6', 'Elected workers\' councils, not a government ministry, should have the final say over national economic decisions.', { ctrl: 1, state: 0.3 });
  L('k7', 'Economic decisions are best made by trained experts and planners rather than by votes in the workplace.', { ctrl: -1 });

  /* 7. Scope: National Path (-) / World Revolution (+) */
  L('w1', 'Socialism can be fully built in a single country, even if capitalism survives in the rest of the world.', { scope: -1 });
  L('w2', 'A socialist revolution confined to one country will eventually degenerate or be crushed.', { scope: 1 });
  C('w3', 'A newly socialist country should put its resources first into:',
    'Building up its own economy and defenses',
    'Spreading revolution abroad and supporting revolutionary movements in other countries', { scope: 1 });
  L('w4', 'Each country has to find its own road to socialism, based on its own history and culture.', { scope: -1, nat: 0.3 });
  H('w5', 'In 1943 Stalin dissolved the Communist International, the organization that coordinated communist parties worldwide, partly to reassure his wartime allies.',
    'Dissolving the Communist International was a betrayal of internationalism.', { scope: 1 },
    { ml: -0.6, poststalin: -0.6, hoxha: -0.5, mzt: -0.3, orthotrot: 1, sparts: 1, grant: 1, pablo: 1, moreno: 1, cliff: 1, posad: 1 });
  L('w6', 'Workers in different countries have more in common with each other than with the capitalists of their own nation.', { scope: 1, nat: -0.3 });
  L('w7', 'Patriotism can be a positive force for socialists.', { scope: -1, nat: 0.4, soc: 0.3 });

  /* 8. Geopolitics: Campism (-) / Third Camp (+) */
  L('g1', 'Socialists in the West should support states that resist US power, such as Russia, China or Iran, even when those states are not socialist.', { geo: -1 });
  L('g2', 'Socialists should oppose every ruling class equally, whether it is aligned with Washington or against it.', { geo: 1 });
  C('g3', 'When a non-socialist government opposed to the US faces a popular uprising at home, socialists should:',
    'Be skeptical of the uprising, since it may serve Western interests',
    'Support the uprising\'s democratic and working-class demands', { geo: 1 });
  H('g4', 'In 2022 Russia launched a full-scale invasion of Ukraine.',
    'The invasion was mainly a response to NATO expansion, and socialists in the West should focus their criticism on NATO.', { geo: -1 },
    { hoxha: 0, gonzalo: -0.8, mlm: -0.5 });
  L('g5', 'China today is an imperialist power competing with the United States.', { geo: 1 },
    { deng: -1, ml: -0.6, poststalin: -0.6, hoxha: 1, gonzalo: 1, mlm: 1, avakian: 1, mtw: 0, sparts: -1, orthotrot: -0.4, posad: -0.6, cliff: 1, bolivar: -1, juche: -0.6 });
  L('g6', 'A multipolar world, with several competing great powers, is better for the global working class than one dominated by the United States.', { geo: -1 });
  L('g7', 'Socialists should support Western military aid to a country defending itself against invasion, even though Western governments are imperialist.', { geo: 1, path: 0.4 },
    { cliff: -0.3, lux: -0.6, council: -1, bordiga: -1, impossib: -1, communization: -1, sparts: -1, ml: -1, ancom: -0.2, shacht: 1, socdem: 1, demsoc: 0.5 });

  /* 9. Historical Verdict: Defense (-) / Critique (+) */
  L('v1', 'The Soviet Union, despite its flaws, was a genuine socialist society.', { verdict: -1 },
    { orthotrot: -0.2, grant: -0.2, sparts: -0.4 });
  L('v2', 'Under Stalin, the Soviet Union became a new class society in which a bureaucracy exploited the workers.', { verdict: 1 },
    { orthotrot: -0.5, grant: -0.5, sparts: -0.8, pablo: -0.3, moreno: -0.3, posad: -0.6, cliff: 1, shacht: 1, council: 1, bordiga: 0.3 });
  H('v3', 'Between 1936 and 1938 the Soviet government arrested around 1.5 million people and executed roughly 680,000 in the Great Purge, including most of the original Bolshevik leadership.',
    'Western accounts have greatly exaggerated the scale and injustice of the purges.', { verdict: -1 },
    { orthotrot: -1, sparts: -1, grant: -1, posad: -1, poststalin: -0.6, reformcomm: -1, deng: -0.2 });
  C('v4', 'Overall, the 20th-century socialist states (the USSR, China, Cuba, Vietnam and others) were:',
    'Real achievements of the working class, to be defended despite their mistakes',
    'Distortions of socialism that matter mainly as warnings', { verdict: 1 });
  H('v5', 'In 1956 Hungarian workers and students rose against their Communist government and formed workers\' councils. Soviet troops crushed the uprising.',
    'The Soviet intervention in Hungary was necessary to protect socialism from counter-revolution.', { verdict: -1, form: -0.3 },
    { tito: 0, hoxha: 1, mzt: 1, orthotrot: -1, grant: -0.8, pablo: -1, sparts: -0.3, eurocomm: -1, reformcomm: -1 });
  L('v6', 'Cuba is a model of what socialism can achieve in a poor country.', { verdict: -1, geo: -0.3 },
    { castro: 1, cliff: -1, shacht: -1, sparts: 0.6, pablo: 0.6, posad: 0.6, orthotrot: 0, bolivar: 1, mlm: -0.4, hoxha: -0.6 });
  L('v7', 'Socialists should openly condemn the repression carried out by past socialist governments.', { verdict: 1, form: 0.3 });

  /* 10. Theory: Scientific (-) / Critical (+) */
  L('t1', 'Marxism is a science that has discovered the objective laws of historical development.', { theory: -1 });
  L('t2', 'The development of the productive forces is the main driver of history.', { theory: -1, tech: -0.3 });
  L('t3', 'Culture, ideology and psychology deserve as much attention from socialists as economics.', { theory: 1 });
  C('t4', 'The most important thing Marx offers is:',
    'A scientific account of how capitalism works and where it is heading',
    'A critique of alienation and domination that shows how people can free themselves', { theory: 1 });
  L('t5', 'Capitalism will eventually collapse from its own internal contradictions.', { theory: -1 },
    { bernstein: -1 });
  L('t6', 'Marx\'s early writings on alienation matter as much as Capital.', { theory: 1 });
  L('t7', 'Socialism is a moral ideal, not just the outcome of historical laws.', { theory: 1 },
    { bernstein: 1, ethical: 1, christsoc: 1 });

  /* 11. Technology & Growth: Accelerate (-) / Restrain (+) */
  L('e1', 'Economic growth in rich countries must be deliberately reduced to stay within ecological limits.', { tech: 1 }, null, { degrowth: 1 });
  L('e2', 'Developing technology and productive capacity as fast as possible is the material basis for communism.', { tech: -1 });
  L('e3', 'Advanced AI and automation, once under collective ownership, could free humanity from most work.', { tech: -1 }, null, { accel: 1, skeptic: -1 });
  C('e4', 'Socialists\' main response to AI should be to:',
    'Seize and socialize it so its productivity benefits everyone',
    'Restrict and slow its deployment, because it concentrates power and destroys skilled work', { tech: 1 }, null, { skeptic: 1, accel: -1 });
  L('e5', 'Nuclear power should be a major part of a socialist energy system.', { tech: -1 });
  L('e6', 'Working classes in rich countries will have to accept lower material consumption as part of a just ecological transition.', { tech: 1, scope: 0.2 },
    { mtw: 1 }, { degrowth: 1 });
  L('e7', 'The machinery and technology developed under capitalism are neutral tools that a socialist society can simply take over.', { tech: -1, theory: -0.3 },
    { operaismo: -0.8, autonomism: -0.6, gandhian: -1, communization: -0.6, situ: -0.6 }, { skeptic: -1 });

  /* 12. Class & Oppression: Class Primacy (-) / Intersectional (+) */
  L('i1', 'Racism and sexism exist mainly because they serve capitalism, and they would largely fade under socialism.', { opp: -1 });
  L('i2', 'Patriarchy and white supremacy are systems of oppression in their own right, not just by-products of capitalism.', { opp: 1 }, null, { race: 0.5, fem: 0.5 });
  C('i3', 'A socialist organization\'s public messaging should focus on:',
    'Universal class demands that unite all workers, like jobs, wages and healthcare',
    'Class demands together with explicit demands against racism, sexism and homophobia', { opp: 1 });
  L('i4', '"Identity politics" distracts from class struggle.', { opp: -1 });
  L('i5', 'Unpaid domestic and care work, mostly done by women, is as central to capitalism as wage labor.', { opp: 1 },
    { autonomism: 1 }, { fem: 1 });
  L('i6', 'Movements organized around race, gender or sexuality can be revolutionary forces in their own right, not only as part of the workers\' movement.', { opp: 1 });
  L('i7', 'The industrial working class remains the decisive force for socialist revolution.', { opp: -1 },
    { postop: -1, mtw: -0.6, mzt: -0.3, naxal: -0.5, gonzalo: -0.2 });

  /* Capitalism: Abolish (-) / Retain (+) */
  L('cap1', 'Private ownership of large companies should be abolished.', { cap: -1 });
  L('cap2', 'A well-regulated capitalism with a strong welfare state is the best realistic economic system.', { cap: 1 },
    { socdem: 0.4 });
  L('cap3', 'The profit motive is compatible with a fair society if it is properly taxed and regulated.', { cap: 1 },
    { deng: 0.3, socdem: 0.5, mutualism: -0.4, marketsoc: 0 });

  L('cap4', 'Breaking up large corporations to restore competition between smaller firms is the best way to curb corporate power.', { cap: 0.5, coord: 0.5 },
    { progpop: 1, soclib: 0.3, socdem: -0.3, demsoc: -0.4, mutualism: 0.6, leftpop: 0, marketsoc: -0.2, ml: -1, deng: -0.6 });

  /* Religion */
  L('rel1', 'My own commitment to socialism is grounded in religious faith.', { rel: 1 });
  L('rel2', 'Religion is, on balance, an obstacle to human liberation that socialists should work to overcome.', { rel: -1 });
  L('rel3', 'The teachings of Jesus, the Prophet Muhammad or other religious figures contain a call for economic equality that socialists should embrace.', { rel: 1 });

  /* Means: Armed Struggle (-) / Nonviolence (+) */
  L('nv1', 'Armed struggle is a legitimate means of overthrowing capitalism.', { nv: -1 });
  L('nv2', 'Socialists should stay nonviolent even if their opponents use violence against them.', { nv: 1 });
  L('nv3', 'Sabotaging property, such as pipelines or factories, is a legitimate tactic in political struggle.', { nv: -1 },
    { ecolen: 1, insurrect: 1 });

  /* Social values: Progressive (-) / Traditional (+) */
  L('soc1', 'Traditional family structures should be protected and supported by a socialist state.', { soc: 1 });
  L('soc2', 'Strict limits on immigration protect workers\' wages and should be supported by socialists.', { soc: 1, scope: -0.3 });
  L('soc3', 'Socialist politics should openly champion LGBTQ rights.', { soc: -1, opp: 0.3 }, null, { queer: 1 });

  /* National question: Anti-nationalist (-) / National Liberation (+) */
  L('nat1', 'Oppressed nations have the right to self-determination, including the right to form their own independent state.', { nat: 1 },
    { ml: 0.8, lux: -1, bordiga: -0.6, council: -1 });
  L('nat2', 'Nationalism, even the nationalism of oppressed peoples, divides the working class and should be opposed.', { nat: -1 });
  L('nat3', 'National minorities should have cultural autonomy, with their own schools and institutions wherever they live in a state, rather than a separate territory.', { nat: 0.3 },
    { austro: 1, ml: -0.6, orthotrot: -0.4, lux: -0.2 });

  /* Identity and liberation */
  L('fem2', 'Housework, childcare and care for the sick and elderly should be collectivized and socially funded under socialism.', { opp: 0.5 },
    { autonomism: 1, ml: 0.6, demconf: 1 }, { fem: 1 });
  L('race1', 'Capitalism developed historically through slavery and colonialism, and racism is built into its structure.', { opp: 0.6 },
    { mtw: 1, cabral: 1, political: 0 }, { race: 1 });
  L('race2', 'Reparations for slavery and colonialism should be part of a socialist program.', { opp: 0.8 },
    { mtw: 1, cabral: 1, sankara: 0.6 }, { race: 1 });
  L('queer2', 'The nuclear family is a product of class society that socialists should aim to move beyond.', { soc: -1, opp: 0.4 },
    { autonomism: 0.6, ancom: 0.6, juche: -1, leftcon: -1, islamic: -1 }, { queer: 1, fem: 0.5 });
  L('ind1', 'Indigenous peoples\' collective land rights and self-government should take priority over national development plans.', { opp: 0.5, tech: 0.5, nat: 0.4 },
    { mariategui: 1, zapat: 1, ml: -0.5, deng: -1, bolivar: -0.2, castro: -0.2, naxal: 0.8, gandhian: 0.3, sankara: 0.3, nkrumah: -0.6 }, { ind: 1 });
  L('ind2', 'Precolonial communal traditions offer a model for socialism today.', { theory: 0.3 },
    { ujamaa: 1, mariategui: 1, zapat: 1, cabral: 0.6, narod: 0.8, nkrumah: 0.4, gandhian: 0.6, ml: -0.6, kautsky: -0.8, bordiga: -1, deng: -0.6 }, { ind: 1 });

  /* Technology and AI */
  L('ai1', 'AI systems developed by private corporations should be brought under public ownership.', { ctrl: -0.5, cap: -0.5 });
  L('ai2', 'AI-assisted planning could solve the information problems that undermined Soviet central planning.', { coord: -1, tech: -1 },
    { cyber: 1, parecon: -0.2, marketsoc: -0.6, degrowth: -0.3, gandhian: -1 }, { accel: 1 });
  L('ai3', 'Software, data and digital infrastructure should be shared as a commons, free for anyone to use and modify.', { ctrl: 0.5 },
    { platcoop: 1, accel: 0.6, postop: 1, ancom: 0.8 }, { commons: 1 });
  L('ai4', 'Platforms like Uber and Amazon should be replaced by cooperatives owned by their workers and users.', { ctrl: 1, coord: 0.3 },
    { platcoop: 1, coop: 1, econdem: 0.8 }, { commons: 1 });
  L('ai5', 'Workers are right to resist new technologies that destroy their jobs or deskill their work, as the Luddites did.', { tech: 1 },
    { ml: -0.6, deng: -1, accel: -1, cyber: -0.8, operaismo: 0.6, autonomism: 0.6, insurrect: 0.8, gandhian: 1 }, { skeptic: 1 });
  L('ai6', 'Universal basic income is a good socialist response to automation.', { path: 0.4, tech: -0.4 },
    { postop: 1, accel: 1, autonomism: 0.8, ml: -0.8, bordiga: -1, kautsky: -0.5, parecon: -0.5, cyber: -0.6, impossib: -1, grant: -0.5, deng: -0.6 }, { accel: 0.5 });
  L('ai7', 'Advanced AI poses risks serious enough that its development should be slowed or paused.', { tech: 1 },
    { accel: -1, cyber: -0.8, deng: -1, degrowth: 0.6 }, { skeptic: 1, accel: -1 });
})(typeof globalThis !== 'undefined' ? globalThis : window);
