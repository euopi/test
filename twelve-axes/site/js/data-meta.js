/* Axes, families, tags and theory schools for the Twelve Axes test. */
(function (G) {
  var TA = (G.TA = G.TA || {});

  // The twelve core axes. Scores run from -1 (neg pole) to +1 (pos pole).
  TA.axes = [
    { id: 'rupture', n: 'Transition', neg: 'Rupture', pos: 'Continuity',
      d: 'Whether capitalism ends in a decisive break with the existing order, or is transformed step by step without one.' },
    { id: 'arena', n: 'Arena', neg: 'Institutional', pos: 'Extra-institutional',
      d: 'Where the decisive struggle happens: inside parliaments, courts and the law, or outside them in strikes, occupations, councils and open defiance.' },
    { id: 'org', n: 'Organization', neg: 'Party', pos: 'Self-organization',
      d: 'Whether a disciplined party should lead, or the class and its movements should organize themselves through councils, unions and assemblies.' },
    { id: 'state', n: 'The State', neg: 'Wield', pos: 'Dismantle',
      d: 'Whether socialism needs a state, existing or new, to carry it through, or the state should be dismantled as part of the change itself.' },
    { id: 'form', n: 'Political Form', neg: 'Proletarian Dictatorship', pos: 'Pluralism',
      d: 'Whether opposition parties, free elections and civil liberties should be restricted during the transition, or protected throughout.' },
    { id: 'coord', n: 'Coordination', neg: 'Planning', pos: 'Market',
      d: 'Whether a socialist economy should be coordinated by a plan, central or participatory, or by markets between socially owned firms.' },
    { id: 'ctrl', n: 'Control', neg: 'State Ownership', pos: 'Self-Management',
      d: 'Whether production and public services should be owned and directed by the state, or run by the people who work in and use them.' },
    { id: 'scope', n: 'Scope', neg: 'National Path', pos: 'World Revolution',
      d: 'Whether socialism can be built within one country along its own road, or only succeeds as an international process.' },
    { id: 'geo', n: 'Geopolitics', neg: 'Campism', pos: 'Third Camp',
      d: 'Whether socialists should back states that resist US power, or oppose every ruling class regardless of its alignment.' },
    { id: 'verdict', n: 'Historical Verdict', neg: 'Defense', pos: 'Critique',
      d: 'How you judge the 20th-century socialist states: achievements to defend, or distortions and new forms of class rule.' },
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
    { id: 'repub', n: 'Republicanism', neg: 'Class Frame', pos: 'Republican Frame',
      d: 'Whether you frame socialism mainly as ending exploitation and class rule, or as extending republican self-government and freedom from domination into the economy.' },
    { id: 'soc', n: 'Social Values', neg: 'Progressive', pos: 'Traditional',
      d: 'Whether you hold progressive or traditional positions on family, immigration and sexuality.' }
  ];

  TA.families = [
    { id: 'ml', n: 'Marxist-Leninist', mod: true },
    { id: 'mao', n: 'Maoist', mod: true },
    { id: 'trot', n: 'Trotskyist', mod: true },
    { id: 'classic', n: 'Classical & Pre-Leninist', mod: true },
    { id: 'leftcom', n: 'Left Communist & Syndicalist', mod: true },
    { id: 'auto', n: 'Libertarian Marxist & Autogestion', mod: true },
    { id: 'anarch', n: 'Anarchist', mod: true },
    { id: 'demsoc', n: 'Democratic & Reformist', mod: true },
    { id: 'econ', n: 'Market, Cooperative & Planning Models', mod: true },
    { id: 'repub', n: 'Republican Socialism', mod: true },
    { id: 'eco', n: 'Ecological', mod: true }
  ];

  // Tags. "items" tags come from tagged questions; the rest from scale scores.
  TA.tags = [
    { id: 'fem', n: 'Marxist Feminist', src: 'items', d: 'You take distinctly Marxist-feminist positions: on housework, the family, how gender oppression is rooted, and women organizing autonomously.' },
    { id: 'ind', n: 'Indigenous / Decolonial', src: 'items', d: 'You give Indigenous land rights and communal traditions a central place in socialism.' },
    { id: 'degrowth', n: 'Degrowth', src: 'items', d: 'You hold that material throughput in rich countries has to shrink.' },
    { id: 'accel', n: 'Accelerationist', src: 'items', d: 'You want AI, automation and technology pushed forward and socialized, not slowed.' },
    { id: 'skeptic', n: 'Techno-skeptic', src: 'items', d: 'You treat AI and new technology as tools of capitalist power that need restraint or resistance.' },
    { id: 'autog', n: 'Autogestion', src: 'items', d: 'You want self-management to reach past the workplace into housing, the city, public services and everyday life.' },
    { id: 'commons', n: 'Digital Commons', src: 'items', d: 'You want software, data and platforms owned in common by their users and workers.' },
    { id: 'eco', n: 'Ecological', src: 'axis', d: 'Your answers put ecological limits close to the center of your socialism.' },
    { id: 'campist', n: 'Campist', src: 'axis', d: 'You lean toward backing states that oppose US power, even non-socialist ones.' },
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
    { id: 'cont', n: 'Class & Politics', neg: 'Class Essential', pos: 'Contingent' },
    { id: 'statet', n: 'State', neg: 'Instrument', pos: 'Social Relation' },
    { id: 'space', n: 'Space', neg: 'Aspatial', pos: 'Spatial' },
    { id: 'repro', n: 'Reproduction', neg: 'Production-centered', pos: 'Reproduction-centered' },
    { id: 'strug', n: 'Motor', neg: 'Logic of Capital', pos: 'Class Struggle' }
  ];

  function S(id, n, p, d, f) { return { id: id, n: n, p: p, d: d, f: f }; }
  TA.schools = [
    S('diamat', 'Dialectical Materialism', { det: -1, heg: 0.4, cult: -0.5, anal: -0.4, val: -0.8, glob: -0.2, cont: -1, statet: -1, space: -0.3, repro: -0.5, strug: -0.3 },
      'Marxism as a general science of nature and history, with dialectical laws operating in both. The official philosophy of the Soviet tradition.', 'Engels, Plekhanov, Lenin (Materialism and Empirio-criticism), Mao (On Contradiction)'),
    S('hegelian', 'Hegelian Marxism', { det: 0.5, heg: 1, cult: 0.4, anal: -0.9, val: 0.3, glob: -0.3, cont: -0.7, statet: -0.2, space: -0.3, repro: -0.3, strug: 0.3 },
      'Restores Hegel to the center of Marx: the proletariat grasps society as a totality, and reification is the key to bourgeois consciousness.', 'Lukács, Korsch, Goldmann'),
    S('frankfurt', 'Frankfurt School Critical Theory', { det: 0.3, heg: 0.8, cult: 1, anal: -0.8, val: 0.4, glob: -0.4, cont: -0.2, statet: 0.2, space: -0.2, repro: 0, strug: -0.6 },
      'Critique of instrumental reason, the culture industry and the administered society, with deep pessimism about the working class as it actually exists.', 'Adorno, Horkheimer, Marcuse, Benjamin'),
    S('humanist', 'Marxist Humanism', { det: 0.9, heg: 0.9, cult: 0.5, anal: -0.7, val: 0.2, glob: -0.2, cont: -0.4, statet: 0, space: -0.2, repro: 0.2, strug: 0.8 },
      'Alienation and human self-emancipation as the core of Marx, read through the 1844 Manuscripts and the self-activity of ordinary people.', 'Raya Dunayevskaya, Erich Fromm, Karel Kosík, the Praxis School'),
    S('gramsci', 'Gramscian Marxism', { det: 0.6, heg: 0.4, cult: 0.9, anal: -0.5, val: -0.2, glob: -0.3, cont: 0, statet: 0.7, space: 0, repro: 0, strug: 0.4 },
      'Power in developed capitalism rests on hegemony and consent as much as force, so the struggle is fought over culture, common sense and civil society before any decisive confrontation.', 'Antonio Gramsci, Palmiro Togliatti, Stuart Hall'),
    S('althusser', 'Structural Marxism', { det: -0.6, heg: -1, cult: 0.5, anal: -0.2, val: -0.3, glob: -0.3, cont: 0.1, statet: 0.3, space: -0.2, repro: 0.2, strug: -0.4 },
      'Anti-humanist and anti-Hegelian: history is a process without a subject, societies are overdetermined structures, and ideology works through state apparatuses.', 'Louis Althusser, Étienne Balibar, Pierre Macherey'),
    S('poulantzas', 'Relational State Theory', { det: 0.2, heg: -0.6, cult: 0.3, anal: -0.2, val: -0.2, glob: -0.2, cont: 0.2, statet: 1, space: 0.2, repro: 0, strug: 0.4 },
      'The state is the material condensation of a relationship of class forces, so struggles run through it as well as against it. The basis for a democratic road that transforms the state from inside and outside.', 'Nicos Poulantzas, Bob Jessop'),
    S('analytical', 'Analytical Marxism', { det: -0.3, heg: -1, cult: -0.5, anal: 1, val: -0.9, glob: -0.4, cont: -0.3, statet: -0.3, space: -0.3, repro: -0.2, strug: 0 },
      'Rebuilds Marxism with analytic philosophy, game theory and rational choice, dropping dialectics and the labor theory of value.', 'G. A. Cohen, John Roemer, Jon Elster, Erik Olin Wright'),
    S('valueform', 'Value-Form Theory', { det: 0, heg: 0.6, cult: -0.3, anal: -0.4, val: 1, glob: 0, cont: -0.4, statet: -0.2, space: -0.2, repro: -0.2, strug: -0.8 },
      'Reads Capital as a critique of the social form of value, money and abstract labor, an impersonal domination that rules capitalists and workers alike.', 'Isaak Rubin, Hans-Georg Backhaus, Michael Heinrich, Moishe Postone'),
    S('open', 'Open Marxism', { det: 1, heg: 0.7, cult: -0.2, anal: -0.8, val: 0.8, glob: -0.1, cont: 0.2, statet: 0.5, space: 0, repro: 0, strug: 1 },
      'Marxist categories are forms of class struggle, not fixed structures, and the state is a form of capitalist social relations rather than a thing to be captured.', 'John Holloway, Werner Bonefeld, Richard Gunn, Simon Clarke'),
    S('postmarx', 'Post-Marxism', { det: 0.8, heg: -0.3, cult: 1, anal: -0.3, val: 0, glob: -0.3, cont: 1, statet: 0.5, space: 0, repro: 0, strug: 0.3 },
      'Drops class essentialism: political identities and alliances are built through discourse, and socialism becomes a project of radical democracy.', 'Ernesto Laclau, Chantal Mouffe'),
    S('political', 'Political Marxism', { det: 0.2, heg: -0.6, cult: -0.8, anal: 0.5, val: -0.3, glob: -1, cont: -0.5, statet: 0.3, space: -0.2, repro: -0.3, strug: 0.2 },
      'Capitalism is defined by market dependence and originated in English agrarian property relations, not trade. The separation of the economic and the political is unique to it.', 'Robert Brenner, Ellen Meiksins Wood, George Comninel, Benno Teschke'),
    S('regulation', 'Regulation Theory', { det: -0.2, heg: -0.4, cult: -0.2, anal: 0.4, val: -0.5, glob: -0.2, cont: 0.1, statet: 0.5, space: 0, repro: 0.1, strug: -0.3 },
      'Capitalism passes through distinct regimes of accumulation, like Fordism, each stabilized for a time by its own institutions, wage norms and state policy.', 'Michel Aglietta, Alain Lipietz, Robert Boyer'),
    S('worldsys', 'World-Systems & Dependency Theory', { det: -0.3, heg: -0.2, cult: -0.6, anal: 0, val: -0.5, glob: 1, cont: -0.4, statet: -0.4, space: 0.5, repro: 0, strug: -0.3 },
      'Capitalism is one world-system in which the core extracts surplus from the periphery, so underdevelopment is produced, not inherited.', 'Immanuel Wallerstein, Samir Amin, Andre Gunder Frank, Walter Rodney'),
    S('monthly', 'Monthly Review School', { det: -0.5, heg: 0.2, cult: -0.6, anal: 0.1, val: -0.6, glob: 0.5, cont: -0.6, statet: -0.5, space: 0.3, repro: -0.2, strug: -0.4 },
      'Monopoly capitalism suffers from a surplus it cannot absorb, and capitalism opens a metabolic rift between society and nature.', 'Paul Baran, Paul Sweezy, Harry Magdoff, John Bellamy Foster'),
    S('geography', 'Marxist Geography', { det: 0.2, heg: 0.3, cult: 0.3, anal: -0.3, val: 0.2, glob: 0.3, cont: -0.2, statet: 0.2, space: 1, repro: 0.3, strug: 0.2 },
      'Capitalism produces space: cities, real estate and infrastructure absorb surplus capital, displace crises elsewhere, and become sites of struggle over the right to the city.', 'Henri Lefebvre, David Harvey, Neil Smith, Doreen Massey'),
    S('srt', 'Social Reproduction Theory', { det: 0.3, heg: 0.2, cult: 0.2, anal: -0.3, val: 0.2, glob: 0, cont: -0.3, statet: 0, space: 0.2, repro: 1, strug: 0.4 },
      'Capitalism depends on the largely unpaid work of producing and sustaining workers, so households, schools and care are sites of class struggle and gender oppression is rooted in production as a whole.', 'Lise Vogel, Tithi Bhattacharya, Susan Ferguson, Silvia Federici'),
    S('autonomist', 'Autonomist Marxism', { det: 0.8, heg: -0.2, cult: 0, anal: -0.5, val: 0.3, glob: 0.2, cont: 0, statet: 0.1, space: 0.2, repro: 0.3, strug: 1 },
      'Reads Capital from the working-class side: struggles drive capitalist development, and class composition, not the logic of capital, is the starting point.', 'Mario Tronti, Antonio Negri, Harry Cleaver, Sergio Bologna')
  ];
})(typeof globalThis !== 'undefined' ? globalThis : window);
