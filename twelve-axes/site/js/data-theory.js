/* Part 3 (optional): theory module, 40 questions. Scores theoretical schools only.
   L items load on theory dimensions (with optional overrides); X items give every
   school a hand-set expectation, in this order:
   diamat, hegelian, frankfurt, humanist, gramsci, althusser, poulantzas, analytical,
   valueform, open, postmarx, political, regulation, worldsys, monthly, geography,
   srt, autonomist */
(function (G) {
  var TA = (G.TA = G.TA || {});
  var I = (TA.items = TA.items || []);
  var ORDER = ['diamat', 'hegelian', 'frankfurt', 'humanist', 'gramsci', 'althusser', 'poulantzas', 'analytical',
    'valueform', 'open', 'postmarx', 'political', 'regulation', 'worldsys', 'monthly', 'geography', 'srt', 'autonomist'];
  function L(id, q, l, x) { I.push({ id: id, part: 'theory', t: 'l', q: q, l: l, x: x || null }); }
  function X(id, q, vals) {
    var x = {};
    ORDER.forEach(function (k, i) { x[k] = vals[i]; });
    I.push({ id: id, part: 'theory', t: 'l', q: q, l: null, x: x });
  }
  function MX(id, q, opts, picks) {
    var x = {};
    ORDER.forEach(function (k, i) { x[k] = picks[i]; });
    I.push({ id: id, part: 'theory', t: 'm', q: q, opts: opts.map(function (t) { return { t: t }; }), x: x });
  }

  /* ----- History, method and dialectics ----- */
  L('th1', 'History has no predetermined direction. Socialism is a possibility, not a necessity.', { det: 1 });
  L('th2', 'Hegel\'s dialectic is essential for understanding Marx.', { heg: 1 });
  L('th3', 'Marxism should adopt the standard methods of analytic philosophy and the social sciences, and drop the dialectic.', { anal: 1, heg: -0.5 });
  X('th4', 'Dialectics applies to nature itself, not only to society and thought.',
    [1, -1, -0.8, -0.4, -0.4, -0.2, -0.4, -1, -0.6, -0.8, -0.6, -0.6, -0.4, 0, 0.6, 0, -0.2, -0.6]);
  X('th5', 'Historical materialism is a functional explanation: relations of production exist because they promote the development of the productive forces.',
    [0.6, -0.6, -0.6, -0.6, -0.4, -0.4, -0.4, 1, -0.4, -1, -0.8, -0.8, -0.2, 0, 0.2, -0.2, -0.4, -0.8]);
  X('th6', 'History is a process without a subject: neither the proletariat nor humanity is its author.',
    [0.2, -1, 0, -1, -0.4, 1, 0.4, 0.2, 0.5, -0.8, 0.2, 0, 0.2, 0.2, 0, -0.2, -0.4, -0.6]);
  X('th7', 'The proletariat is the subject of history, and its coming to self-consciousness is the revolution.',
    [0.4, 1, -0.6, 0.4, 0.2, -1, -0.4, -1, -0.6, 0, -1, -0.4, -0.4, -0.4, -0.2, -0.2, 0, 0.4]);
  X('th8', 'Marxism is above all a philosophy of human freedom, rooted in the self-activity of ordinary people, including those at the margins.',
    [-0.6, 0.2, -0.2, 1, 0.3, -1, 0, -0.4, -0.4, 0.6, 0.2, -0.2, -0.4, -0.2, -0.2, 0.2, 0.4, 0.6]);
  X('th9', 'Class consciousness means grasping society as a totality, something the fragmented outlook of bourgeois thought cannot do.',
    [0.2, 1, 0.6, 0.4, 0.2, -0.6, -0.4, -1, 0.2, 0.2, -0.6, -0.4, -0.4, 0, 0, 0, 0, -0.2]);

  /* ----- Value, crisis and the logic of capital ----- */
  L('th10', 'Marx\'s value theory is a critique of how social relations take the form of things like money and commodities, not mainly a theory of prices.', { val: 1 });
  X('th11', 'The labor theory of value is false or unnecessary, and Marxism can do without it.',
    [-1, -0.4, 0, -0.4, 0, -0.2, 0, 1, -1, -0.8, 0.4, 0, 0, -0.2, -0.3, -0.4, -0.4, -0.4]);
  X('th12', 'Abstract labor and value are impersonal forms of domination that rule everyone, capitalists included. The goal is to abolish them, not to liberate labor.',
    [-1, -0.2, 0.3, -0.4, -0.4, -0.2, -0.2, -0.8, 1, 0.4, -0.4, -0.4, -0.4, -0.4, -0.6, 0, -0.2, -0.6]);
  L('th13', 'Capitalism follows its own logic of accumulation, which works largely behind the backs of workers and capitalists alike.', { strug: -1 });
  L('th14', 'Workers\' struggles are the motor of capitalist development; capital restructures itself in response to them.', { strug: 1 });
  MX('th15', 'Which explanation of capitalist crises comes closest to yours?', [
    'The rate of profit tends to fall as machinery replaces labor.',
    'Monopolies generate more surplus than they can profitably absorb.',
    'Competition locks firms into overcapacity that no one is willing to scrap.',
    'Workers\' struggles squeeze profits and force capital to restructure.',
    'Each regime of accumulation exhausts the institutions that stabilized it.'
  ], [0, [0, 3], [1, 0], 3, [4, 0], 0, [4, 0], [2, 4], 0, 3, [4, 1], 2, 4, [1, 0], 1, [0, 1], [3, 0], 3]);
  X('th16', 'Capitalism passes through distinct long phases, like Fordism and neoliberalism, each held together for a time by its own mix of institutions, wage norms and state policy.',
    [-0.2, -0.2, 0.4, 0, 0.6, 0.2, 0.6, 0.4, -0.4, -0.2, 0.2, 0, 1, 0.4, 0.4, 0.6, 0.2, 0.2]);

  /* ----- Political Marxism ----- */
  X('th17', 'Capitalism originated in changes to property relations in English agriculture, where tenants had to compete on the market to keep their land.',
    [-0.2, 0, 0, 0, 0, 0, 0, 0.4, 0.2, 0, 0, 1, 0, -1, -0.4, -0.2, 0, 0]);
  X('th18', 'What makes capitalism unique is that people depend on the market to survive, not that markets or trade exist.',
    [-0.2, 0.2, 0.2, 0.2, 0, 0.2, 0.2, 0.2, 0.6, 0.4, 0, 1, 0.2, -0.6, -0.2, 0.2, 0.2, 0.2]);
  X('th19', 'Under capitalism, exploitation and political rule are split into separate spheres; in earlier societies the same lords and states did both.',
    [-0.2, 0, 0.2, 0, 0.2, 0.4, 0.5, 0.2, 0.4, 0.4, 0, 1, 0.2, -0.4, -0.2, 0, 0, 0]);
  X('th20', 'Renaissance Italy and the Dutch Republic, despite their trade and finance, were not capitalist societies.',
    [-0.4, 0, 0, 0, 0, 0, 0, 0.2, 0.2, 0, 0, 1, -0.2, -1, -0.6, -0.4, 0, 0]);
  X('th21', 'The idea that "bourgeois revolutions", like the French Revolution, brought capitalism to power is mistaken.',
    [-1, -0.6, -0.2, -0.4, -0.6, -0.4, -0.2, -0.2, 0, 0.2, 0, 0.8, -0.2, -0.2, -0.4, -0.2, 0, 0]);
  X('th22', 'Unequal exchange between rich and poor countries is a main source of global inequality, alongside exploitation within each country.',
    [0, 0, 0, 0, 0, 0, 0, -0.4, -0.4, -0.2, 0, -1, 0, 1, 0.5, 0.4, 0, 0]);
  L('th23', 'Capitalism is best understood as one world-system in which the core exploits the periphery.', { glob: 1 },
    { political: -1, worldsys: 1 });

  /* ----- State, ideology and hegemony ----- */
  X('th24', 'The state is neither a tool of the capitalist class nor a neutral referee, but a condensation of the balance of class forces, which struggles inside it can shift.',
    [-1, -0.2, 0, 0, 0.6, 0.2, 1, -0.2, -0.4, -0.2, 0.4, 0.2, 0.5, -0.4, -0.6, 0.2, 0, 0]);
  X('th25', 'The form of the capitalist state follows from the commodity form, so the state cannot simply be captured and used for socialism.',
    [-0.6, 0, 0.2, 0, -0.4, 0.2, -0.8, -0.2, 1, 0.8, -0.4, 0, -0.2, 0, -0.2, 0, 0, 0.4]);
  X('th26', 'Ruling-class power in developed countries rests mainly on consent organized in civil society, and socialists need intellectuals rooted in the working class to contest it.',
    [-0.4, 0.2, -0.2, 0.2, 1, 0.2, 0.6, -0.4, -0.4, -0.2, 0.4, -0.2, 0.2, -0.4, -0.4, 0.2, 0.2, -0.4]);
  X('th27', 'In developed countries, revolution requires a long struggle for hegemony before any decisive confrontation with the state.',
    [-0.3, 0, -0.2, 0, 1, 0, 0.6, -0.2, -0.4, -0.4, 0.6, 0, 0, -0.2, -0.2, 0, 0, -0.6]);
  X('th28', 'Ideology is built into institutions like schools, churches, media and the family, which reproduce the social order.',
    [-0.2, 0.2, 0.8, 0.2, 0.8, 1, 0.6, 0, 0, 0, 0.6, -0.2, 0.2, 0, 0, 0.2, 0.6, 0]);
  X('th29', 'Mass culture and the entertainment industry are among capitalism\'s most powerful means of domination.',
    [-0.4, 0.4, 1, 0.2, 0.6, 0.4, 0.2, -0.4, 0.2, 0, 0.4, -0.6, 0, -0.2, 0.2, 0, 0, -0.2]);
  X('th30', 'The administered society of late capitalism turns reason into a tool of domination, so critique must defend the individual against the totality.',
    [-1, -0.4, 1, 0.3, -0.2, -0.6, -0.2, -0.6, 0.2, 0.2, 0.2, -0.6, -0.4, -0.4, -0.4, 0, -0.2, -0.4]);
  X('th31', 'The working class in developed capitalism has been largely integrated into the system and may no longer be a revolutionary agent.',
    [-1, -0.6, 1, -0.6, 0, -0.4, 0, 0.2, 0.4, -0.6, 0.6, -0.6, 0.2, 0.4, 0.4, 0, -0.6, -1]);
  L('th32', 'There is no necessary link between class position and political identity; political identities are built through discourse.', { cont: 1 });

  /* ----- Space, reproduction, ecology ----- */
  L('th33', 'The production of space, through urbanization, real estate and infrastructure, is as central to capitalism as production in factories.', { space: 1 });
  X('th34', 'Capital escapes its crises by moving into new places and building new infrastructure, which only postpones the problem.',
    [0, 0, 0, 0, 0.2, 0, 0.2, 0, 0, 0, 0, -0.2, 0.4, 0.6, 0.4, 1, 0.2, 0.2]);
  L('th35', 'Capitalism depends on the unpaid work of producing and raising workers, and this reproduction is a site of class struggle as important as the workplace.', { repro: 1 });
  X('th36', 'Gender oppression under capitalism is rooted in the social relations of reproducing labor-power, not in a separate system of patriarchy.',
    [0.2, 0, 0, 0, 0, 0.2, 0, 0, 0.2, 0.2, -0.6, 0.2, 0, 0, 0, 0.2, 1, 0.2]);
  X('th37', 'Capitalism\'s ecological crisis follows from its drive to accumulate and is already explained by Marx\'s idea of a metabolism between society and nature.',
    [0.2, 0, 0.2, 0.2, 0, 0, 0, -0.4, 0.2, 0, -0.4, -0.2, 0, 0.3, 1, 0.4, 0.2, 0]);
  X('th38', 'Modern capitalism is dominated by giant monopolies whose main problem is absorbing the surplus they generate, not a falling rate of profit.',
    [-0.5, 0, 0.2, 0, 0, 0, 0, -0.2, -0.5, -0.2, 0, -0.2, 0.2, 0.4, 1, 0.2, 0, -0.2]);

  /* ----- Subject and struggle ----- */
  X('th39', 'Marxist categories like value and the state are forms of ongoing struggle, not fixed structures that work independently of human action.',
    [-0.8, 0.4, 0, 0.5, 0.4, -1, 0.3, -0.2, -0.4, 1, 0.4, 0.2, -0.2, -0.4, -0.4, 0.2, 0.4, 0.8]);
  X('th40', 'Analysis should start from the composition of the working class (how it is organized, divided and fights) rather than from capital\'s laws of motion.',
    [-0.6, 0, -0.4, 0.4, 0.2, -0.4, 0.2, 0, -0.6, 0.6, 0, 0, -0.2, -0.4, -0.4, 0.2, 0.4, 1]);
})(typeof globalThis !== 'undefined' ? globalThis : window);
