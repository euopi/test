/* Axes, families, tags and theory schools for the Twelve Axes test. */
(function (G) {
  var TA = (G.TA = G.TA || {});

  // The twelve core axes. Scores run from -1 (neg pole) to +1 (pos pole).
  TA.axes = [
    { id: 'path', n: 'Path', neg: 'Revolution', pos: 'Reform',
      d: 'Whether capitalism has to end in a revolutionary break with the existing state, or can be transformed gradually through elections, legislation and institutions.' },
    { id: 'org', n: 'Organization', neg: 'Vanguard', pos: 'Spontaneity',
      d: 'Whether a disciplined party of committed revolutionaries should lead the working class, or the class should organize itself through councils, unions and mass movements.' },
    { id: 'state', n: 'The State', neg: "Workers' State", pos: 'Abolition',
      d: 'Whether a transitional state run by the working class is needed after capitalism, or the state should be dismantled as part of the revolution itself.' },
    { id: 'form', n: 'Political Form', neg: 'Proletarian Dictatorship', pos: 'Pluralism',
      d: 'Whether opposition parties, a free press and civil liberties should be restricted during the transition, or protected throughout.' },
    { id: 'coord', n: 'Coordination', neg: 'Planning', pos: 'Market',
      d: 'Whether a socialist economy should be coordinated by a plan, central or participatory, or by markets between socially owned firms.' },
    { id: 'ctrl', n: 'Control', neg: 'State Ownership', pos: 'Self-Management',
      d: 'Whether industry should be owned and directed by the state, or run by the people who work in it.' },
    { id: 'scope', n: 'Scope', neg: 'National Path', pos: 'World Revolution',
      d: 'Whether socialism can be built within one country along its own road, or only succeeds as an international revolution.' },
    { id: 'geo', n: 'Geopolitics', neg: 'Campism', pos: 'Third Camp',
      d: 'Whether socialists should back states that resist US power, or oppose every ruling class regardless of its alignment.' },
    { id: 'verdict', n: 'Historical Verdict', neg: 'Defense', pos: 'Critique',
      d: 'How you judge the 20th-century socialist states: achievements to defend, or distortions and new forms of class rule.' },
    { id: 'theory', n: 'Theory', neg: 'Scientific', pos: 'Critical',
      d: 'Whether Marxism is mainly a science of historical laws and productive forces, or a critique centered on alienation, consciousness and culture.' },
    { id: 'tech', n: 'Technology & Growth', neg: 'Accelerate', pos: 'Restrain',
      d: 'Whether socialism should develop technology, automation and AI as fast as possible, or slow growth and limit technology for ecological and social reasons.' },
    { id: 'opp', n: 'Class & Oppression', neg: 'Class Primacy', pos: 'Intersectional',
      d: 'Whether class is the fundamental antagonism, or race, gender and other oppressions are systems of domination in their own right.' }
  ];

  // Supplementary scales, measured by the shorter blocks.
  TA.supp = [
    { id: 'cap', n: 'Capitalism', neg: 'Abolish', pos: 'Retain',
      d: 'Whether private ownership of the economy should be abolished, or kept and regulated.' },
    { id: 'nat', n: 'National Question', neg: 'Anti-nationalist', pos: 'National Liberation',
      d: 'Whether national self-determination and the nationalism of oppressed peoples are progressive, or divide the working class.' },
    { id: 'nv', n: 'Means', neg: 'Armed Struggle', pos: 'Nonviolence',
      d: 'Whether armed struggle and sabotage are legitimate, or change has to come through nonviolent means.' },
    { id: 'rel', n: 'Religion', neg: 'Secular', pos: 'Religious',
      d: 'Whether your socialism is secular and materialist, or grounded in religious faith.' },
    { id: 'soc', n: 'Social Values', neg: 'Progressive', pos: 'Traditional',
      d: 'Whether you hold progressive or traditional positions on family, immigration and sexuality.' }
  ];

  TA.families = [
    { id: 'ml', n: 'Marxist-Leninist', mod: true },
    { id: 'mao', n: 'Maoist', mod: true },
    { id: 'trot', n: 'Trotskyist', mod: true },
    { id: 'classic', n: 'Classical & Pre-Leninist', mod: true },
    { id: 'leftcom', n: 'Left Communist & Syndicalist', mod: true },
    { id: 'auto', n: 'Autonomist & Libertarian Marxist', mod: true },
    { id: 'anarch', n: 'Anarchist', mod: true },
    { id: 'demsoc', n: 'Democratic & Reformist', mod: true },
    { id: 'econ', n: 'Market, Cooperative & Planning Models', mod: true },
    { id: 'gsouth', n: 'National Liberation Socialism', mod: true },
    { id: 'relig', n: 'Religious, Ethical & Nonviolent', mod: true },
    { id: 'eco', n: 'Ecological', mod: true },
    { id: 'bound', n: 'Non-socialist Left', mod: false }
  ];

  // Tags. "items" tags come from tagged questions; the rest from scale scores.
  TA.tags = [
    { id: 'fem', n: 'Marxist Feminist', src: 'items', d: 'You treat unpaid reproductive work and gender oppression as central to how capitalism works.' },
    { id: 'race', n: 'Racial Capitalism', src: 'items', d: 'You see slavery, colonialism and racism as built into the foundations of capitalism.' },
    { id: 'queer', n: 'Queer Liberation', src: 'items', d: 'You see sexual and family liberation as part of the socialist project.' },
    { id: 'ind', n: 'Indigenous / Decolonial', src: 'items', d: 'You give Indigenous land rights and communal traditions a central place in socialism.' },
    { id: 'degrowth', n: 'Degrowth', src: 'items', d: 'You hold that material throughput in rich countries has to shrink.' },
    { id: 'accel', n: 'Accelerationist', src: 'items', d: 'You want AI, automation and technology pushed forward and socialized, not slowed.' },
    { id: 'skeptic', n: 'Techno-skeptic', src: 'items', d: 'You treat AI and new technology as tools of capitalist power that need restraint or resistance.' },
    { id: 'commons', n: 'Digital Commons', src: 'items', d: 'You want software, data and platforms owned in common by their users and workers.' },
    { id: 'eco', n: 'Ecological', src: 'axis', d: 'Your answers put ecological limits close to the center of your socialism.' },
    { id: 'campist', n: 'Campist', src: 'axis', d: 'You lean toward backing states that oppose US power, even non-socialist ones.' },
    { id: 'relig', n: 'Religious', src: 'axis', d: 'Your socialism draws on religious faith.' },
    { id: 'socon', n: 'Socially Conservative', src: 'axis', d: 'You combine socialist economics with traditional positions on family, immigration or sexuality.' },
    { id: 'pacifist', n: 'Nonviolent', src: 'axis', d: 'You reject armed struggle and sabotage as means of change.' },
    { id: 'natlib', n: 'National Liberationist', src: 'axis', d: 'You treat the self-determination of oppressed nations as a core socialist cause.' },
    { id: 'antinat', n: 'Anti-nationalist', src: 'axis', d: 'You oppose nationalism in every form, including that of oppressed nations.' }
  ];

  // Theory module dimensions.
  TA.theoryDims = [
    { id: 'det', n: 'History', neg: 'Determined', pos: 'Open' },
    { id: 'heg', n: 'Hegel', neg: 'Anti-Hegelian', pos: 'Hegelian' },
    { id: 'cult', n: 'Focus', neg: 'Political Economy', pos: 'Culture & Ideology' },
    { id: 'anal', n: 'Method', neg: 'Dialectical', pos: 'Analytical' },
    { id: 'val', n: 'Value', neg: 'Quantitative', pos: 'Value-Form' },
    { id: 'glob', n: 'Scale', neg: 'Class Relations', pos: 'World-System' },
    { id: 'cont', n: 'Class & Politics', neg: 'Class Essential', pos: 'Contingent' }
  ];

  TA.schools = [
    { id: 'diamat', n: 'Dialectical Materialism', p: { det: -1, heg: 0.4, cult: -0.5, anal: -0.4, val: -0.8, glob: -0.2, cont: -1 },
      d: 'Marxism as a general science of nature and history, with dialectical laws operating in both. The official philosophy of the Soviet tradition.', f: 'Engels, Plekhanov, Stalin, Mao (On Contradiction)' },
    { id: 'hegelian', n: 'Hegelian Marxism', p: { det: 0.5, heg: 1, cult: 0.4, anal: -0.9, val: 0.3, glob: -0.3, cont: -0.7 },
      d: 'Restores Hegel to the center of Marx: the proletariat grasps society as a totality, and reification is the key to bourgeois consciousness.', f: 'Lukács, Korsch' },
    { id: 'frankfurt', n: 'Frankfurt School Critical Theory', p: { det: 0.3, heg: 0.8, cult: 1, anal: -0.8, val: 0.3, glob: -0.4, cont: -0.2 },
      d: 'Critique of instrumental reason, the culture industry and authoritarian personality, with deep pessimism about the working class as it actually exists.', f: 'Adorno, Horkheimer, Marcuse, Benjamin' },
    { id: 'humanist', n: 'Marxist Humanism', p: { det: 0.9, heg: 0.9, cult: 0.5, anal: -0.7, val: 0.2, glob: -0.2, cont: -0.4 },
      d: 'Alienation and human self-emancipation as the core of Marx, read through the 1844 Manuscripts and Hegel\'s dialectic of negativity.', f: 'Dunayevskaya, Fromm, Kosík, the Praxis School' },
    { id: 'gramsci', n: 'Gramscian Marxism', p: { det: 0.6, heg: 0.4, cult: 0.9, anal: -0.5, val: -0.2, glob: -0.3, cont: 0 },
      d: 'Power in developed capitalism rests on hegemony and consent as much as force, so the struggle is fought over culture, common sense and institutions.', f: 'Gramsci, Stuart Hall, Togliatti' },
    { id: 'althusser', n: 'Structural Marxism', p: { det: -0.6, heg: -1, cult: 0.5, anal: -0.2, val: -0.3, glob: -0.3, cont: 0.1 },
      d: 'Anti-humanist and anti-Hegelian: history is a process without a subject, societies are overdetermined structures, and ideology works through state apparatuses.', f: 'Althusser, Balibar, Poulantzas' },
    { id: 'analytical', n: 'Analytical Marxism', p: { det: -0.3, heg: -1, cult: -0.5, anal: 1, val: -0.9, glob: -0.4, cont: -0.3 },
      d: 'Rebuilds Marxism with analytic philosophy, game theory and rational choice, dropping dialectics and the labor theory of value.', f: 'G. A. Cohen, John Roemer, Jon Elster, Erik Olin Wright' },
    { id: 'valueform', n: 'Value-Form Theory', p: { det: 0, heg: 0.6, cult: -0.3, anal: -0.4, val: 1, glob: 0, cont: -0.4 },
      d: 'Reads Capital as a critique of the social form of value, money and abstract labor, not as a theory of prices or a celebration of labor.', f: 'Rubin, Backhaus, Reichelt, Heinrich, Postone, Wertkritik' },
    { id: 'open', n: 'Open Marxism', p: { det: 1, heg: 0.7, cult: -0.2, anal: -0.8, val: 0.8, glob: -0.1, cont: 0.2 },
      d: 'Treats Marxist categories as open to class struggle rather than as fixed structures, rejecting both determinism and positivist social science.', f: 'Holloway, Bonefeld, Gunn' },
    { id: 'postmarx', n: 'Post-Marxism', p: { det: 0.8, heg: -0.3, cult: 1, anal: -0.3, val: 0, glob: -0.3, cont: 1 },
      d: 'Drops class essentialism: political identities and alliances are built through discourse, and socialism becomes a project of radical democracy.', f: 'Laclau, Mouffe' },
    { id: 'political', n: 'Political Marxism', p: { det: 0.2, heg: -0.6, cult: -0.8, anal: 0.5, val: -0.3, glob: -1, cont: -0.5 },
      d: 'Capitalism originated in changing property relations in English agriculture, not in trade or colonial plunder. Class relations, not world markets, explain history.', f: 'Robert Brenner, Ellen Meiksins Wood' },
    { id: 'worldsys', n: 'World-Systems & Dependency Theory', p: { det: -0.3, heg: -0.2, cult: -0.6, anal: 0, val: -0.5, glob: 1, cont: -0.4 },
      d: 'Capitalism is one world-system in which the core extracts surplus from the periphery, so underdevelopment is produced, not inherited.', f: 'Wallerstein, Samir Amin, Andre Gunder Frank, Walter Rodney' },
    { id: 'monthly', n: 'Monthly Review School', p: { det: -0.5, heg: 0.2, cult: -0.6, anal: 0.1, val: -0.6, glob: 0.5, cont: -0.6 },
      d: 'Monopoly capitalism suffers from a surplus it cannot absorb, and capitalism opens a metabolic rift between society and nature.', f: 'Paul Baran, Paul Sweezy, Harry Magdoff, John Bellamy Foster' }
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
