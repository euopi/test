/* Part 3 (optional): theory module. Scores theoretical schools only. */
(function (G) {
  var TA = (G.TA = G.TA || {});
  var I = (TA.items = TA.items || []);
  function L(id, q, l, x) { I.push({ id: id, part: 'theory', t: 'l', q: q, l: l, x: x || null }); }

  L('th1', 'History has no predetermined direction. Socialism is a possibility, not a necessity.', { det: 1 });
  L('th2', 'Hegel\'s dialectic is essential for understanding Marx.', { heg: 1 });
  L('th3', 'Marxism should drop the dialectic and adopt the standard methods of analytic philosophy and social science.', { anal: 1, heg: -0.5 });
  L('th4', 'Mass culture and the entertainment industry are among capitalism\'s most powerful tools of domination.', { cult: 1 });
  L('th5', 'Marx\'s value theory is not mainly a theory of prices. It is a critique of how social relations take the form of things like money and commodities.', { val: 1 });
  L('th6', 'The labor theory of value is false or unnecessary, and Marxism can do without it.', { val: -0.5, anal: 0.6 },
    { analytical: 1, valueform: -1, diamat: -1, monthly: -0.3, political: 0 });
  L('th7', 'Capitalism is best understood as a single world-system in which the core exploits the periphery.', { glob: 1 });
  L('th8', 'Capitalism originated in changing property relations between English landlords and tenants, not in trade or colonial plunder.', { glob: -1 },
    { political: 1, worldsys: -1, monthly: -0.5 });
  L('th9', 'There is no necessary link between class position and political identity. Political identities are built through discourse.', { cont: 1 });
  L('th10', 'The alienated human being, and human nature, should be at the center of Marxist theory.', { det: 0.5, heg: 0.4 },
    { humanist: 1, althusser: -1, frankfurt: 0.5, diamat: -0.6, analytical: 0.2 });
  L('th11', 'Ideology is not just false ideas. It is embedded in institutions like schools, churches and the family that shape who we are.', { cult: 0.8 },
    { althusser: 1, gramsci: 1, frankfurt: 0.8 });
  L('th12', 'Modern capitalism is dominated by giant monopolies whose main problem is absorbing the surplus they generate, not a falling rate of profit.', { glob: 0.3 },
    { monthly: 1, diamat: -0.5, valueform: -0.5, analytical: -0.2, worldsys: 0.4, political: -0.2 });
  L('th13', 'Class consciousness means grasping society as a totality, which the fragmented view of bourgeois thought cannot achieve.', { heg: 0.8, cult: 0.3 },
    { hegelian: 1, frankfurt: 0.6, althusser: -0.6, analytical: -1, postmarx: -0.6 });
  L('th14', 'Dialectics applies to nature itself, not only to society and thought.', { det: -1 },
    { diamat: 1, hegelian: -1, frankfurt: -0.8, monthly: 0.6, althusser: -0.2, analytical: -1, valueform: -0.6, open: -0.8 });
  // Discriminating items: every school has a hand-set expectation.
  function X(id, q, x) { I.push({ id: id, part: 'theory', t: 'l', q: q, l: null, x: x }); }
  X('th15', 'The working class in developed capitalism has been largely integrated into the system and may no longer be a revolutionary agent.',
    { diamat: -1, hegelian: -0.6, frankfurt: 1, humanist: -0.6, gramsci: 0, althusser: -0.4, analytical: 0.2, valueform: 0.4, open: -0.6, postmarx: 0.6, political: -0.6, worldsys: 0.4, monthly: 0.4 });
  X('th16', 'The proletariat is the subject of history, and its coming to self-consciousness is the revolution.',
    { diamat: 0.4, hegelian: 1, frankfurt: -0.6, humanist: 0.4, gramsci: 0.2, althusser: -1, analytical: -1, valueform: -0.6, open: 0, postmarx: -1, political: -0.4, worldsys: -0.4, monthly: -0.2 });
  X('th17', 'Marxism is above all a philosophy of human freedom, rooted in the self-activity of ordinary people, including those at the margins: workers, women, Black people, youth.',
    { diamat: -0.6, hegelian: 0.2, frankfurt: -0.2, humanist: 1, gramsci: 0.3, althusser: -1, analytical: -0.4, valueform: -0.4, open: 0.6, postmarx: 0.2, political: -0.2, worldsys: -0.2, monthly: -0.2 });
  X('th18', 'Unequal exchange between rich and poor countries is a main source of global inequality, alongside exploitation inside each country.',
    { diamat: 0, hegelian: 0, frankfurt: 0, humanist: 0, gramsci: 0, althusser: 0, analytical: -0.4, valueform: -0.4, open: -0.2, postmarx: 0, political: -1, worldsys: 1, monthly: 0.5 });
  X('th19', 'Capitalism\'s ecological crisis follows from its drive to accumulate and is already explained by Marx\'s concept of a metabolism between society and nature.',
    { diamat: 0.2, hegelian: 0, frankfurt: 0.2, humanist: 0.2, gramsci: 0, althusser: 0, analytical: -0.4, valueform: 0.2, open: 0, postmarx: -0.4, political: -0.2, worldsys: 0.3, monthly: 1 });
  X('th20', 'Abstract labor and value are impersonal forms of domination that rule everyone, capitalists included. The goal is to abolish them, not to liberate labor.',
    { diamat: -1, hegelian: -0.2, frankfurt: 0.3, humanist: -0.4, gramsci: -0.4, althusser: -0.2, analytical: -0.8, valueform: 1, open: 0.4, postmarx: -0.4, political: -0.4, worldsys: -0.4, monthly: -0.6 });
  X('th21', 'Marxist categories like value and the state are forms of ongoing struggle, not fixed structures that operate independently of human action.',
    { diamat: -0.8, hegelian: 0.4, frankfurt: 0, humanist: 0.5, gramsci: 0.4, althusser: -1, analytical: -0.2, valueform: -0.4, open: 1, postmarx: 0.4, political: 0.2, worldsys: -0.4, monthly: -0.4 });
  X('th22', 'Ruling-class power rests mainly on consent organized in civil society, and socialists need their own intellectuals rooted in the working class to contest it.',
    { diamat: -0.4, hegelian: 0.2, frankfurt: -0.2, humanist: 0.2, gramsci: 1, althusser: 0.2, analytical: -0.4, valueform: -0.4, open: -0.2, postmarx: 0.4, political: -0.2, worldsys: -0.4, monthly: -0.4 });
  X('th23', 'The administered society of late capitalism reduces reason to a tool for domination, so critique must defend the individual against the totality.',
    { diamat: -1, hegelian: -0.4, frankfurt: 1, humanist: 0.3, gramsci: -0.2, althusser: -0.6, analytical: -0.6, valueform: 0.2, open: 0.2, postmarx: 0.2, political: -0.6, worldsys: -0.4, monthly: -0.4 });
})(typeof globalThis !== 'undefined' ? globalThis : window);
