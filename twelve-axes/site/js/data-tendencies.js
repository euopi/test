/* The 87 tendencies. p = position on each scale (-1..1), k = defining scales
   (double weight). Scales left out of p are treated as undefined for that
   tendency and scored at low weight. */
(function (G) {
  var TA = (G.TA = G.TA || {});
  var L = (TA.tendencies = []);
  function T(id, fam, n, p, k, d, f) { L.push({ id: id, fam: fam, n: n, p: p, k: k || [], d: d, f: f }); }

  /* ---------- Marxist-Leninist ---------- */
  T('ml', 'ml', 'Marxism-Leninism',
    { rupture: -1.0, arena: 0.5, org: -1, state: -1, form: -1, coord: -1, ctrl: -1, scope: -0.5, geo: -0.8, verdict: -1, tech: -0.9, opp: -0.6, nat: 0.5 },
    ['verdict', 'org', 'form', 'coord'],
    'The doctrine codified under Stalin: a vanguard party, a one-party dictatorship of the proletariat, central planning, and socialism built first in one country. Defends the Soviet record as the main achievement of the 20th-century working class.',
    'Lenin, Stalin, Dimitrov, the pre-1956 Comintern parties');
  T('poststalin', 'ml', 'Post-Stalin Marxism-Leninism',
    { rupture: -0.3, arena: -0.4, org: -0.8, state: -1, form: -0.9, coord: -1, ctrl: -1, scope: -0.6, geo: -1, verdict: -0.7, tech: -0.9, opp: -0.6, nat: 0.4 },
    ['geo', 'rupture'],
    'The line of the pro-Soviet parties after 1956: criticism of Stalin\'s personality cult, peaceful coexistence with the West, and peaceful or parliamentary roads to socialism in the capitalist countries, while defending the USSR and its bloc.',
    'Khrushchev, Brezhnev, Gus Hall, the pro-Moscow parties');
  T('hoxha', 'ml', 'Anti-Revisionism (Hoxhaism)',
    { rupture: -1.0, arena: 0.5, org: -1, state: -1, form: -1, coord: -1, ctrl: -1, scope: -0.3, geo: 0.3, verdict: -0.5, tech: -0.9, opp: -0.6, nat: 0.3 },
    ['form', 'coord'],
    'Upholds Stalin and rejects every later deviation as revisionism: Khrushchev\'s USSR, Tito\'s Yugoslavia and, after 1978, Mao\'s China. Socialist Albania\'s self-reliance is the model.',
    'Enver Hoxha, the Party of Labour of Albania');
  T('tito', 'ml', 'Titoism',
    { rupture: -0.8, arena: 0.4, org: -0.6, state: -0.8, form: -0.7, coord: 0.2, ctrl: 0.8, scope: -0.8, geo: 0.3, verdict: 0, tech: -0.8, opp: -0.5, nat: 0.3, cap: -0.9 },
    ['ctrl', 'coord', 'geo'],
    'Yugoslavia\'s road after the 1948 break with Stalin: workers\' self-management of enterprises, market coordination between firms, a single ruling party, and non-alignment between the blocs.',
    'Josip Broz Tito, Edvard Kardelj, Milovan Đilas (early)');
  T('castro', 'ml', 'Castroism / Guevarism',
    { rupture: -1.0, arena: 1, org: -0.5, state: -1, form: -0.9, coord: -0.9, ctrl: -0.9, scope: 0.3, geo: -0.6, verdict: -0.6, tech: -0.6, opp: -0.3, nat: 0.8, nv: -1 },
    ['org', 'nv'],
    'The Cuban road: a guerrilla foco can create revolutionary conditions, moral incentives and the "new man" over material ones, and revolution exported across Latin America and Africa.',
    'Fidel Castro, Che Guevara, Régis Debray');
  T('hochiminh', 'ml', 'Ho Chi Minh Thought',
    { rupture: -1.0, arena: 0.9, org: -1, state: -1, form: -1, coord: -0.7, ctrl: -0.8, scope: -0.5, geo: -0.5, verdict: -0.7, tech: -0.7, opp: -0.4, nat: 1, nv: -0.9 },
    ['nat'],
    'Marxism-Leninism fused with national liberation: a broad patriotic front under communist leadership, balancing Moscow and Beijing, and later market reform under the party (Đổi Mới).',
    'Ho Chi Minh, Võ Nguyên Giáp, the Communist Party of Vietnam');
  T('juche', 'ml', 'Juche',
    { rupture: -1.0, arena: 0.7, org: -1, state: -1, form: -1, coord: -1, ctrl: -1, scope: -1, geo: -0.4, verdict: -0.6, tech: -0.6, opp: -0.8, soc: 0.7, nat: 1 },
    ['scope', 'nat', 'soc'],
    'North Korea\'s state ideology: self-reliance in politics, economy and defense, the masses as masters of the revolution under the guidance of the leader, and the army first (Songun).',
    'Kim Il Sung, Kim Jong Il');
  T('deng', 'ml', 'Dengism',
    { rupture: -0.5, arena: 0, org: -1, state: -1, form: -1, coord: 0.6, ctrl: -0.5, scope: -1, geo: -0.9, verdict: -0.9, tech: -1, opp: -0.7, soc: 0.2, nat: 0.6, cap: -0.5 },
    ['coord', 'scope', 'tech'],
    'Socialism with Chinese characteristics: the Communist Party keeps power while markets, private capital and foreign investment develop the productive forces through a long primary stage of socialism.',
    'Deng Xiaoping, Jiang Zemin, Xi Jinping');
  T('reformcomm', 'ml', 'Reform Communism',
    { rupture: 0.3, arena: -0.7, org: 0.2, state: -0.5, form: 0.6, coord: 0.3, ctrl: 0.2, scope: -0.3, geo: 0.2, verdict: 0.3, tech: -0.5, opp: -0.2, nat: 0.2, cap: -0.9 },
    ['form', 'verdict'],
    'Socialism with a human face: democratizing the Soviet-type system from inside the ruling party, with press freedom, economic reform and an end to the monopoly on power.',
    'Alexander Dubček, Imre Nagy, Mikhail Gorbachev');

  /* ---------- Maoist ---------- */
  T('mzt', 'mao', 'Mao Zedong Thought',
    { rupture: -1.0, arena: 0.9, org: -1, state: -1, form: -1, coord: -0.8, ctrl: -0.6, scope: -0.4, geo: -0.2, verdict: -0.6, tech: -0.4, opp: -0.4, nat: 0.8, nv: -1 },
    ['rupture', 'nv'],
    'The ideology of the Chinese Communist Party under Mao: peasant-based people\'s war, the mass line, continuous struggle against capitalist roaders within the party, and the Three Worlds theory in foreign policy.',
    'Mao Zedong, Lin Biao, the Gang of Four');
  T('mlm', 'mao', 'Marxism-Leninism-Maoism',
    { rupture: -1.0, arena: 1, org: -1, state: -1, form: -1, coord: -0.9, ctrl: -0.6, scope: 0.3, geo: 0.2, verdict: -0.4, tech: -0.5, opp: -0.2, nat: 0.7, nv: -1 },
    ['rupture', 'verdict'],
    'Maoism as a third and higher stage of Marxism, synthesized in the 1980s and 90s: protracted people\'s war, the Cultural Revolution as a model, and post-1976 China as capitalist.',
    'The Revolutionary Internationalist Movement, the CPI (Maoist), the CPP');
  T('gonzalo', 'mao', 'Gonzaloism',
    { rupture: -1.0, arena: 1, org: -1, state: -1, form: -1, coord: -0.9, ctrl: -0.6, scope: 0.5, geo: 0.6, verdict: -0.5, tech: -0.5, opp: -0.5, nat: 0.5, soc: 0.2, nv: -1 },
    ['org', 'nv', 'form'],
    'The Shining Path\'s line: people\'s war is universally applicable, including in imperialist countries, and the party is militarized around the guiding thought of its leader.',
    'Abimael Guzmán (Presidente Gonzalo), the Communist Party of Peru');
  T('naxal', 'mao', 'Naxalism',
    { rupture: -1.0, arena: 1, org: -1, state: -1, form: -1, coord: -0.8, ctrl: -0.5, scope: -0.2, geo: 0.2, verdict: -0.5, tech: 0, opp: 0.2, nat: 0.6, nv: -1 },
    ['nv', 'rupture'],
    'Indian Maoism since the 1967 Naxalbari uprising: armed agrarian revolution against semi-feudal landlordism, rooted among Adivasi and Dalit communities and opposed to mining-led dispossession.',
    'Charu Majumdar, Kanu Sanyal, the CPI (Maoist)');
  T('mtw', 'mao', 'Third Worldism',
    { rupture: -1.0, arena: 0.9, org: -0.8, state: -1, form: -1, coord: -0.8, ctrl: -0.6, scope: 0.8, geo: -0.5, verdict: -0.4, tech: 0.4, opp: 0.2, nat: 0.9, nv: -1 },
    ['scope', 'nat'],
    'The main contradiction is between imperialist and exploited nations. Most workers in rich countries form a labor aristocracy that benefits from global exploitation, so revolution comes from the Global South.',
    'Lin Biao (Long Live the Victory of People\'s War), Arghiri Emmanuel, Zak Cope, J. Sakai');
  T('prachanda', 'mao', 'Prachanda Path',
    { rupture: -0.2, arena: 0, org: -0.8, state: -0.8, form: 0.3, coord: -0.3, ctrl: -0.4, scope: -0.6, geo: -0.2, verdict: -0.3, tech: -0.5, opp: 0.1, nat: 0.7, nv: -0.5 },
    ['form', 'rupture'],
    'Nepalese Maoism, which waged a people\'s war and then entered multiparty parliamentary politics, arguing that a communist party must compete for power in a pluralist democracy.',
    'Pushpa Kamal Dahal (Prachanda), Baburam Bhattarai');
  T('avakian', 'mao', 'New Synthesis (Avakianism)',
    { rupture: -1.0, arena: 0.8, org: -1, state: -1, form: -0.4, coord: -0.8, ctrl: -0.6, scope: 0.7, geo: 0.4, verdict: -0.2, tech: -0.4, opp: 0.4, nat: -0.2, rel: -1, nv: -0.9 },
    ['form', 'scope'],
    'Revises Maoism to stress communism as a science, internationalism over nationalism, and wide room for dissent and intellectual ferment under socialism, while upholding the first wave of socialist states.',
    'Bob Avakian, the Revolutionary Communist Party, USA');

  /* ---------- Trotskyist ---------- */
  var TR = { rupture: -1, org: -1, state: -1, coord: -1, ctrl: -0.5, scope: 1, tech: -0.7, nv: -0.7 };
  function tr(extra) { var o = {}, k; for (k in TR) o[k] = TR[k]; for (k in extra) o[k] = extra[k]; return o; }
  T('orthotrot', 'trot', 'Orthodox Trotskyism',
    tr({ arena: 0.6, form: -0.2, geo: -0.2, verdict: 0.2, opp: -0.4, nat: 0 }),
    ['scope', 'verdict'],
    'Permanent revolution, the Transitional Program, and the USSR as a degenerated workers\' state: defend its nationalized property against imperialism while calling for political revolution against the bureaucracy.',
    'Leon Trotsky, James P. Cannon, Gerry Healy, Pierre Lambert');
  T('pablo', 'trot', 'Pabloism / Mandelism',
    tr({ arena: 0.5, org: -0.6, form: 0.3, geo: -0.3, verdict: 0.2, opp: 0.1, nat: 0.5 }),
    ['nat'],
    'The Fourth International majority after 1953: revolution would come through mass movements and parties not led by Trotskyists, from Third World guerrillas to reformist parties, which Trotskyists should join and push leftward.',
    'Michel Pablo, Ernest Mandel, the United Secretariat of the Fourth International');
  T('grant', 'trot', 'Grantism (Entryism)',
    tr({ rupture: -0.6, arena: -0.2, org: -0.9, form: 0.1, geo: -0.2, verdict: 0.3, opp: -0.7, nat: -0.3 }),
    ['rupture', 'opp'],
    'Long-term entry into mass labor and social democratic parties, raising transitional demands inside them, with an orthodox reading of the workers\' states.',
    'Ted Grant, Alan Woods, Peter Taaffe, Militant, the IMT and CWI');
  T('moreno', 'trot', 'Morenoism',
    tr({ arena: 0.6, form: 0, geo: 0.4, verdict: 0.3, opp: -0.3, nat: 0.4 }),
    ['geo'],
    'Argentine Trotskyism that sees democratic revolutions against dictatorships, even with non-socialist leaderships, as openings toward socialist revolution, and stresses building revolutionary parties.',
    'Nahuel Moreno, the LIT-CI, the UIT-CI');
  T('cliff', 'trot', 'State-Capitalist Trotskyism (Cliffism)',
    tr({ arena: 0.7, org: -0.9, form: 0.4, coord: -0.9, ctrl: 0.1, geo: 1, verdict: 1, tech: -0.5, opp: 0.1, nat: 0.2 }),
    ['geo', 'verdict'],
    'Neither Washington nor Moscow: the USSR, China and their allies were bureaucratic state capitalism, and socialism means the self-emancipation of the working class from below.',
    'Tony Cliff, Chris Harman, the SWP (Britain) and the IST');
  T('shacht', 'trot', 'Third Camp Socialism (Shachtmanism)',
    { rupture: -0.3, arena: 0.2, org: -0.2, state: -0.8, form: 0.9, coord: -0.6, ctrl: 0.3, scope: 0.8, geo: 1, verdict: 1, tech: -0.6, opp: 0, nat: 0 },
    ['form', 'verdict'],
    'The USSR as bureaucratic collectivism, a new exploitative class society neither capitalist nor socialist, and socialism from below as the only real socialism. Some later currents came to prefer Western democracy to Stalinist states.',
    'Max Shachtman, Hal Draper, the Workers\' Liberty tradition');
  T('sparts', 'trot', 'Spartacism',
    tr({ arena: 0.6, form: -0.4, geo: -0.8, verdict: 0, opp: -0.5, nat: -0.2 }),
    ['geo'],
    'Strict Trotskyist orthodoxy with unconditional military defense of the remaining deformed workers\' states (China, Cuba, North Korea, Vietnam) and sharp polemic against other left groups.',
    'James Robertson, the International Communist League');
  T('posad', 'trot', 'Posadism',
    tr({ arena: 0.7, form: -0.5, geo: -0.9, verdict: -0.2, tech: -1, nat: 0.3 }),
    ['tech', 'geo'],
    'A Latin American Trotskyist current that held a nuclear war could clear the way for socialism and that interstellar civilizations would necessarily be socialist.',
    'J. Posadas');

  /* ---------- Classical and pre-Leninist ---------- */
  T('kautsky', 'classic', 'Kautskyism (Orthodox Marxism)',
    { rupture: 0.1, arena: -0.6, org: -0.3, state: -0.5, form: 0.7, coord: -0.8, ctrl: -0.6, scope: 0.3, geo: 0.3, verdict: 0.6, tech: -0.8, opp: -0.5, nat: 0, nv: 0.2 },
    ['theory', 'rupture', 'form'],
    'The Marxism of the Second International: a mass workers\' party that is revolutionary but not revolution-making, winning a democratic majority and a socialist republic as capitalism matures.',
    'Karl Kautsky, August Bebel, the pre-1914 SPD');
  T('bernstein', 'classic', 'Bernsteinian Revisionism',
    { rupture: 1.0, arena: -1, org: 0.2, state: -0.5, form: 1, coord: 0.2, ctrl: -0.2, scope: -0.3, geo: 0.5, verdict: 0.8, tech: -0.5, opp: -0.4, nat: -0.1, nv: 0.4, cap: -0.6 },
    ['rupture'],
    'Evolutionary socialism: capitalism is not polarizing or collapsing, so socialism grows step by step through democracy, unions and cooperatives. The movement matters more than the final goal.',
    'Eduard Bernstein');
  T('austro', 'classic', 'Austromarxism',
    { rupture: 0.4, arena: -0.4, org: -0.2, state: -0.4, form: 0.8, coord: -0.5, ctrl: 0.2, scope: 0, geo: 0.4, verdict: 0.5, tech: -0.5, opp: -0.3, nat: 0.6 },
    ['nat'],
    'A third way between reformism and Bolshevism from the Habsburg empire: democratic socialism with workers\' councils alongside parliament, and national-cultural autonomy for nationalities wherever they live.',
    'Otto Bauer, Max Adler, Karl Renner');
  T('lassalle', 'classic', 'Lassallean State Socialism',
    { rupture: 0.7, arena: -0.8, org: -0.4, state: -1, form: 0.2, coord: -0.3, ctrl: -0.6, scope: -0.8, geo: -0.3, verdict: 0, tech: -0.6, opp: -0.6, soc: 0.4, nat: 0.6, cap: -0.8 },
    ['state', 'scope'],
    'Universal suffrage would let workers capture the national state, which would then fund producer cooperatives. Willing to bargain with conservative governments for social reform.',
    'Ferdinand Lassalle, the General German Workers\' Association');
  T('blanqui', 'classic', 'Blanquism',
    { rupture: -1.0, arena: 1, org: -1, state: -1, form: -1, coord: 0, ctrl: 0, scope: 0, geo: 0, verdict: 0, tech: 0, opp: -0.4, nv: -1 },
    ['org', 'rupture'],
    'Revolution by a small, disciplined conspiracy that seizes power and establishes a temporary dictatorship to educate the masses.',
    'Louis Auguste Blanqui');
  T('utopian', 'classic', 'Utopian Socialism',
    { rupture: 0.8, arena: 0.4, org: 0.6, state: 0.3, form: 0.3, coord: -0.3, ctrl: 0.7, scope: 0.2, geo: 0.3, verdict: 0.3, tech: 0, opp: 0.2, nv: 0.8, rel: 0 },
    ['rupture', 'nv'],
    'Socialism through reason and example: model communities and cooperative colonies that would persuade all classes of a better way of living.',
    'Robert Owen, Charles Fourier, Henri de Saint-Simon, Étienne Cabet');
  T('narod', 'classic', 'Agrarian Socialism (Narodism)',
    { rupture: -0.8, arena: 0.6, org: 0.2, state: 0.2, form: 0.5, coord: 0.2, ctrl: 0.8, scope: -0.4, geo: 0.3, verdict: 0.5, tech: 0.5, opp: -0.2, nat: 0.3, soc: 0.3, nv: -0.5 },
    ['ctrl', 'tech'],
    'The peasant commune as the seed of socialism, letting an agrarian country skip capitalism. Continued by the Socialist Revolutionaries and the Left SRs who shared power with the Bolsheviks in 1917-18.',
    'Alexander Herzen, Nikolay Chernyshevsky, Viktor Chernov, Maria Spiridonova');

  /* ---------- Left communist and syndicalist ---------- */
  T('lux', 'leftcom', 'Luxemburgism',
    { rupture: -0.8, arena: 0.5, org: 0.5, state: -0.6, form: 0.7, coord: -0.8, ctrl: 0.6, scope: 1, geo: 0.9, verdict: 0.6, tech: -0.6, opp: -0.4, nat: -0.8, nv: -0.3 },
    ['nat', 'org', 'form'],
    'Revolution through the mass strike and the self-activity of the working class, with socialist democracy and freedom for dissenters, and no national self-determination under capitalism.',
    'Rosa Luxemburg, Leo Jogiches, the Spartacus League');
  T('council', 'leftcom', 'Council Communism',
    { rupture: -1.0, arena: 1, org: 1, state: -0.2, form: -0.2, coord: -0.7, ctrl: 1, scope: 1, geo: 1, verdict: 1, tech: -0.6, opp: -0.6, nat: -0.9 },
    ['ctrl', 'org', 'verdict'],
    'Workers\' councils, not parties or unions, are the organs of revolution and of the new society. The Bolshevik revolution produced state capitalism.',
    'Anton Pannekoek, Otto Rühle, Herman Gorter, Paul Mattick');
  T('bordiga', 'leftcom', 'Bordigism (Italian Communist Left)',
    { rupture: -1.0, arena: 0.8, org: -1, state: -1, form: -1, coord: -1, ctrl: -0.5, scope: 1, geo: 1, verdict: 0.8, tech: 0, opp: -0.8, nat: -0.6, nv: -0.8 },
    ['form', 'org', 'scope'],
    'An invariant communist program carried by a centralized party, contempt for democracy and parliament, hostility to workers\' self-management, and the USSR as capitalist from early on.',
    'Amadeo Bordiga, the International Communist Party');
  T('communization', 'leftcom', 'Communization',
    { rupture: -1.0, arena: 1, org: 1, state: 1, form: 0, coord: -1, ctrl: 0.2, scope: 1, geo: 1, verdict: 1, tech: 0.2, opp: 0.5, nat: -1 },
    ['state', 'coord'],
    'No transitional period: revolution is the immediate abolition of value, wages, the state and class itself, not a workers\' takeover of the existing economy.',
    'Gilles Dauvé, Théorie Communiste, Endnotes, Tiqqun');
  T('impossib', 'leftcom', 'Impossibilism (World Socialism)',
    { rupture: 0.8, arena: -0.8, org: 0.3, state: 0.5, form: 1, coord: -1, ctrl: 0.3, scope: 1, geo: 1, verdict: 1, tech: -0.6, opp: -0.6, nat: -1, nv: 0.7 },
    ['coord', 'nat'],
    'Socialism comes only when a conscious majority votes for it, after which money, wages and the state are abolished at once. Rejects all reforms and every party that offers them.',
    'The Socialist Party of Great Britain, the World Socialist Movement');
  T('deleon', 'leftcom', 'DeLeonism',
    { rupture: 0.3, arena: -0.2, org: -0.5, state: 0.3, form: 0.6, coord: -0.8, ctrl: 0.9, scope: 0.6, geo: 0.8, verdict: 0.7, tech: -0.7, opp: -0.6, nat: -0.5, nv: 0.3 },
    ['ctrl'],
    'A socialist party wins at the ballot box while socialist industrial unions take and hold the economy, then replace the state with an industrial union government.',
    'Daniel De Leon, the Socialist Labor Party of America');
  T('revsynd', 'leftcom', 'Revolutionary Syndicalism',
    { rupture: -0.7, arena: 0.9, org: 0.7, state: 0.4, form: 0.4, coord: -0.6, ctrl: 1, scope: 0.9, geo: 0.8, verdict: 0.6, tech: -0.5, opp: -0.3, nat: -0.6 },
    ['ctrl', 'org'],
    'Revolutionary unions open to all workers regardless of ideology, the general strike as the means of overthrow, and the union as the cell of the future society.',
    'The IWW, the early CGT, Fernand Pelloutier, Big Bill Haywood');
  T('situ', 'leftcom', 'Situationism',
    { rupture: -1.0, arena: 1, org: 1, state: 1, form: 0.3, coord: -0.7, ctrl: 1, scope: 1, geo: 1, verdict: 1, tech: 0.2, opp: 0.2, nat: -0.8 },
    ['ctrl'],
    'Modern capitalism rules through the spectacle, the commodity turned image, and revolution means the creation of situations, the subversion of everyday life, and generalized workers\' councils.',
    'Guy Debord, Raoul Vaneigem, the Situationist International');

  /* ---------- Autonomist and libertarian Marxist ---------- */
  T('operaismo', 'auto', 'Operaismo (Workerism)',
    { rupture: -1.0, arena: 0.9, org: 0.3, state: 0.3, form: 0.2, coord: -0.5, ctrl: 0.7, scope: 0.8, geo: 0.9, verdict: 0.9, tech: 0.1, opp: -0.6, nat: -0.6 },
    ['opp'],
    'Italian workerism of the 1960s: working-class struggle drives capitalist development, workers\' inquiry comes before program, and the factory worker\'s refusal of work is the core of struggle.',
    'Mario Tronti, Raniero Panzieri, Sergio Bologna');
  T('postop', 'auto', 'Post-Operaismo',
    { rupture: -0.5, arena: 0.7, org: 0.9, state: 0.7, form: 0.5, coord: -0.3, ctrl: 0.6, scope: 1, geo: 0.9, verdict: 0.9, tech: -0.6, opp: 0.7, nat: -0.9 },
    ['opp', 'tech'],
    'Immaterial and cognitive labor and the general intellect now dominate production, power has become a decentered Empire, and the multitude replaces the industrial working class as revolutionary subject.',
    'Antonio Negri, Michael Hardt, Paolo Virno, Maurizio Lazzarato');
  T('autonomism', 'auto', 'Autonomism',
    { rupture: -0.8, arena: 1, org: 1, state: 0.7, form: 0.5, coord: -0.5, ctrl: 1, scope: 0.9, geo: 1, verdict: 1, tech: 0.2, opp: 0.6, nat: -0.5, nv: -0.5 },
    ['org', 'ctrl'],
    'Movements autonomous from parties and unions: social centers, squats, self-reduction and wages-for-housework, building the new society in the cracks of the old.',
    'Autonomia Operaia, Silvia Federici, Mariarosa Dalla Costa, Harry Cleaver');
  T('libmarx', 'auto', 'Libertarian Marxism',
    { rupture: -0.5, arena: 0.7, org: 0.7, state: -0.3, form: 0.8, coord: -0.5, ctrl: 0.9, scope: 0.8, geo: 0.9, verdict: 0.8, tech: -0.3, opp: 0.3, nat: -0.4 },
    ['form', 'ctrl', 'state'],
    'Marx read as an anti-authoritarian: socialism as a free association of producers organized through councils, with Leninist parties seen as having distorted the project.',
    'Cornelius Castoriadis, Socialisme ou Barbarie, Maximilien Rubel');

  T('autog', 'auto', 'Autogestion',
    { rupture: -0.3, arena: 0.3, org: 0.5, state: 0.2, form: 0.8, coord: -0.2, ctrl: 1, scope: 0.3, geo: 0.7, verdict: 0.8, tech: 0.3, opp: 0.5, nat: 0 },
    ['ctrl', 'form'],
    'Generalized self-management: not only workers running their workplaces but residents running their cities, users running public services, and people taking back everyday life. Pursued through unions, municipalities and movements as well as occupations.',
    'Henri Lefebvre, Daniel Guérin, the PSU and the 1970s CFDT, the LIP workers');

  /* ---------- Anarchist ---------- */
  var AN = { state: 1, form: 0.8, ctrl: 1, geo: 0.9, verdict: 1, rel: -0.6 };
  function an(extra) { var o = {}, k; for (k in AN) o[k] = AN[k]; for (k in extra) o[k] = extra[k]; return o; }
  T('ancom', 'anarch', 'Anarcho-Communism',
    an({ rupture: -1.0, arena: 1, org: 0.7, coord: -1, scope: 0.9, tech: 0, opp: 0.6, nat: -0.5, nv: -0.4 }),
    ['state', 'coord'],
    'Abolition of the state, capital and wages together, with free communes distributing goods according to need.',
    'Peter Kropotkin, Errico Malatesta, Emma Goldman');
  T('ansynd', 'anarch', 'Anarcho-Syndicalism',
    an({ rupture: -0.8, arena: 0.9, org: 0.5, coord: -0.7, scope: 0.9, tech: -0.5, opp: -0.1, nat: -0.5 }),
    ['state', 'ctrl'],
    'Revolutionary unions as the vehicle for overthrowing capitalism through the general strike and as the structure of the self-managed economy that replaces it.',
    'Rudolf Rocker, the CNT, Lucy Parsons');
  T('collectivist', 'anarch', 'Collectivist Anarchism',
    an({ rupture: -1.0, arena: 1, org: 0.3, coord: -0.4, scope: 0.8, tech: -0.4, opp: 0 }),
    ['state'],
    'Collective ownership of the means of production through free associations, with each worker paid according to labor performed. The anarchism of the First International.',
    'Mikhail Bakunin, James Guillaume');
  T('platform', 'anarch', 'Platformism / Especifismo',
    an({ rupture: -1.0, arena: 0.9, org: -0.2, coord: -0.8, scope: 0.8, tech: -0.3, opp: 0.3 }),
    ['org'],
    'Anarchists need specific political organizations with theoretical and tactical unity and collective responsibility, working inside wider social movements.',
    'Nestor Makhno, Peter Arshinov, the FAU (Uruguay)');
  T('insurrect', 'anarch', 'Insurrectionary Anarchism',
    an({ rupture: -1.0, arena: 1, org: 1, form: 0.7, coord: -0.6, scope: 0.7, tech: 0.5, opp: 0.4, nv: -0.9 }),
    ['org', 'nv'],
    'Rejects formal organization in favor of informal affinity groups and immediate attack on the state and capital, without waiting for mass movements.',
    'Alfredo Bonanno, Luigi Galleani');
  T('synthesis', 'anarch', 'Synthesis Anarchism',
    an({ rupture: -0.7, arena: 0.9, org: 0.6, coord: -0.4, scope: 0.7, tech: 0, opp: 0.3, nv: -0.2 }),
    ['state'],
    'Unites anarchists of different schools (communist, syndicalist, individualist) in common federations without requiring a single program.',
    'Voline, Sébastien Faure');
  T('mutualism', 'anarch', 'Mutualism',
    an({ rupture: 0.6, arena: 0.5, org: 0.7, form: 0.9, coord: 1, scope: 0.2, tech: -0.2, opp: 0.1, nv: 0.5, cap: -0.7 }),
    ['coord', 'rupture'],
    'Market anarchism: occupancy-and-use property, workers receiving the full product of their labor, and mutual banks offering credit at cost, built up gradually alongside capitalism.',
    'Pierre-Joseph Proudhon, Benjamin Tucker, Kevin Carson');
  T('socialeco', 'anarch', 'Social Ecology (Libertarian Municipalism)',
    { rupture: -0.3, arena: 0, org: 0.2, state: 0.7, form: 0.8, coord: -0.6, ctrl: 0.3, scope: 0.6, geo: 0.8, verdict: 1, tech: 0.8, opp: 0.4, nat: -0.6 },
    ['state', 'tech'],
    'Ecological crisis comes from social hierarchy. Free municipalities run by citizens\' assemblies, confederated together, should own and direct the economy, rather than workers in each industry.',
    'Murray Bookchin, Janet Biehl');
  T('demconf', 'anarch', 'Democratic Confederalism',
    { rupture: -0.4, arena: 0.6, org: -0.5, state: 0.6, form: 0.6, coord: -0.3, ctrl: 0.5, scope: 0.3, geo: 0.2, verdict: 0.6, tech: 0.5, opp: 1, nat: 0.4, nv: -0.6, rel: 0 },
    ['opp', 'state'],
    'Democracy without the state: confederated communes and councils, women\'s liberation as the foundation (jineology), ecology and cooperatives. Practiced in Rojava (Northeast Syria).',
    'Abdullah Öcalan, the PKK and PYD');

  /* ---------- Democratic and reformist ---------- */
  T('demsoc', 'demsoc', 'Democratic Socialism',
    { rupture: 0.4, arena: -0.3, org: 0.3, state: -0.4, form: 1, coord: -0.3, ctrl: 0.2, scope: -0.1, geo: 0.5, verdict: 0.7, tech: -0.2, opp: 0.4, nat: 0.2, nv: 0.5 },
    ['form', 'rupture'],
    'Replace capitalism through democratic means, combining elections with mass movements and unions, while keeping political pluralism and civil liberties throughout.',
    'Michael Harrington, Tony Benn, Bernie Sanders, Jeremy Corbyn, the DSA');
  T('socdem', 'demsoc', 'Social Democracy',
    { rupture: 1.0, arena: -1, org: 0.2, state: -0.6, form: 1, coord: 0.8, ctrl: -0.3, scope: -0.5, geo: 0.6, verdict: 0.9, tech: -0.5, opp: 0.1, nv: 0.6, cap: -0.4 },
    ['coord', 'rupture'],
    'The postwar Nordic model: a market economy tamed by a large welfare state, strong unions, collective bargaining and public services, with socialism as a long horizon rather than a program.',
    'Olof Palme, Clement Attlee, Rudolf Meidner, the Nordic labor parties');
  T('fabian', 'demsoc', 'Fabianism',
    { rupture: 1.0, arena: -1, org: -0.6, state: -0.9, form: 0.8, coord: -0.4, ctrl: -0.8, scope: -0.4, geo: 0.4, verdict: 0.5, tech: -0.6, opp: -0.3, nv: 0.8 },
    ['ctrl', 'org'],
    'Gradual socialism designed by experts and introduced through the permeation of existing institutions: municipal and state ownership, administered by a trained civil service.',
    'Sidney and Beatrice Webb, George Bernard Shaw, the Fabian Society');
  T('eurocomm', 'demsoc', 'Right Eurocommunism',
    { rupture: 0.8, arena: -0.8, org: -0.3, state: -0.6, form: 0.9, coord: -0.3, ctrl: -0.3, scope: -0.5, geo: 0.5, verdict: 0.5, tech: -0.5, opp: 0.1 },
    ['form', 'rupture'],
    'The majority current of 1970s Western communism: independence from Moscow, a pluralist and gradual road to socialism, and broad alliances like the Italian historic compromise with Christian Democracy.',
    'Enrico Berlinguer, Santiago Carrillo, Giorgio Amendola');
  T('lefteuro', 'demsoc', 'Left Eurocommunism (Democratic Road)',
    { rupture: -0.5, arena: 0.1, org: -0.3, state: -0.5, form: 0.5, coord: 0, ctrl: 0.6, scope: -0.4, geo: 0.5, verdict: 0.6, tech: 0.1, opp: 0.3, nat: 0.2, nv: -0.1 },
    ['rupture', 'arena', 'state', 'ctrl'],
    'A democratic road with a rupture at its end: win hegemony and elections, transform the state from inside while building self-management and popular power outside it, and be ready for a decisive, if necessary illegal, break with capital rather than endless reform.',
    'Nicos Poulantzas, Pietro Ingrao, Lucio Magri, Ralph Miliband, Leo Panitch');
  T('leftpop', 'demsoc', 'Left Populism',
    { rupture: 0.7, arena: -0.5, org: -0.2, state: -0.5, form: 0.7, coord: 0.2, ctrl: -0.2, scope: -0.7, geo: 0, verdict: 0.4, tech: -0.2, opp: 0.4, soc: -0.2, nat: 0.3, cap: -0.5 },
    ['scope', 'arena'],
    'Builds a broad popular identity of "the people" against "the elite" around a leader, rather than organizing around class, and aims at radicalizing democracy.',
    'Ernesto Laclau, Chantal Mouffe, Podemos, Jean-Luc Mélenchon');
  T('leftcon', 'demsoc', 'Left-Conservative Socialism',
    { rupture: 0.7, arena: -0.8, org: -0.2, state: -0.8, form: 0.6, coord: 0.1, ctrl: -0.6, scope: -0.9, geo: -0.6, verdict: 0.1, tech: -0.5, opp: -1, soc: 0.9, nat: 0.6, rel: 0.2, cap: -0.6 },
    ['soc', 'opp', 'scope'],
    'Economic redistribution and state intervention combined with social conservatism on immigration, family and national identity, and skepticism of Western foreign policy.',
    'Sahra Wagenknecht (BSW), the KPRF, Blue Labour');

  /* ---------- Market, cooperative and planning models ---------- */
  T('marketsoc', 'econ', 'Market Socialism',
    { rupture: 0.6, arena: -0.6, org: 0.2, state: -0.5, form: 0.9, coord: 0.8, ctrl: -0.3, scope: -0.2, geo: 0.5, verdict: 0.5, tech: -0.5, opp: 0.1, cap: -0.8 },
    ['coord'],
    'Publicly owned firms compete in markets, with prices set by markets or simulated by a planning board, and profits distributed to society.',
    'Oskar Lange, Abba Lerner, John Roemer, Alec Nove');
  T('econdem', 'econ', 'Economic Democracy',
    { rupture: 0.5, arena: -0.4, org: 0.3, state: -0.4, form: 1, coord: 0.9, ctrl: 0.9, scope: -0.2, geo: 0.6, verdict: 0.7, tech: -0.3, opp: 0.2, cap: -0.9 },
    ['coord', 'ctrl'],
    'Worker self-managed firms compete in markets for goods, while investment is socialized and allocated through democratically controlled public banks.',
    'David Schweickart, Richard Wolff');
  T('coop', 'econ', 'Cooperativism',
    { rupture: 0.8, arena: 0.3, org: 0.7, state: 0.2, form: 1, coord: 0.7, ctrl: 1, scope: 0, geo: 0.5, verdict: 0.6, tech: 0, opp: 0.2, nv: 0.8, cap: -0.7 },
    ['ctrl', 'rupture'],
    'Socialism built from below by expanding worker and consumer cooperatives inside the existing economy until they displace capitalist firms.',
    'The Rochdale Pioneers, José María Arizmendiarrieta (Mondragon)');
  T('guild', 'econ', 'Guild Socialism',
    { rupture: 0.6, arena: 0, org: 0.4, state: 0.2, form: 0.9, coord: -0.2, ctrl: 0.9, scope: 0, geo: 0.5, verdict: 0.6, tech: 0.4, opp: 0, rel: 0 },
    ['ctrl'],
    'Industries run by national guilds of workers, balanced by democratic bodies representing consumers and citizens, with a stress on craft and meaningful work.',
    'G. D. H. Cole, A. R. Orage, S. G. Hobson');
  T('parecon', 'econ', 'Participatory Economics',
    { rupture: 0.0, arena: 0.3, org: 0.5, state: 0.4, form: 0.9, coord: -1, ctrl: 1, scope: 0.5, geo: 0.8, verdict: 1, tech: 0, opp: 0.6 },
    ['coord', 'ctrl'],
    'No markets and no central planners: nested workers\' and consumers\' councils negotiate the plan, jobs are balanced for empowerment, and pay follows effort and sacrifice.',
    'Michael Albert, Robin Hahnel');
  T('cyber', 'econ', 'Cybernetic Socialism',
    { rupture: -0.2, arena: -0.3, org: -0.4, state: -0.6, form: 0.3, coord: -1, ctrl: -0.7, scope: 0, geo: -0.2, verdict: -0.2, tech: -1, opp: -0.6 },
    ['coord', 'tech'],
    'Computers, input-output models and now AI make efficient economy-wide planning possible, with labor-time accounting replacing money.',
    'Paul Cockshott, Allin Cottrell, Stafford Beer (Cybersyn), Victor Glushkov');
  T('accel', 'econ', 'Left Accelerationism',
    { rupture: 0.1, arena: -0.2, org: -0.2, state: -0.3, form: 0.6, coord: -0.5, ctrl: 0, scope: 0.7, geo: 0.4, verdict: 0.4, tech: -1, opp: 0.7 },
    ['tech'],
    'Fully automated luxury communism: socialize AI and automation, cut the working week, introduce a universal basic income, and build a post-work future rather than resist technology.',
    'Nick Srnicek, Alex Williams, Aaron Bastani, Laboria Cuboniks');
  T('platcoop', 'econ', 'Platform Cooperativism',
    { rupture: 0.8, arena: 0.2, org: 0.7, state: 0.2, form: 1, coord: 0.6, ctrl: 1, scope: 0.2, geo: 0.5, verdict: 0.6, tech: -0.3, opp: 0.5, nv: 0.8, cap: -0.7 },
    ['ctrl', 'tech'],
    'Digital platforms, from ride-hailing to cloud services, rebuilt as cooperatives owned by their workers and users, alongside open software and data commons.',
    'Trebor Scholz, Nathan Schneider');

  /* ---------- National liberation socialism ---------- */
  T('nasser', 'gsouth', 'Arab Socialism (Nasserism)',
    { rupture: -0.4, arena: -0.2, org: -0.8, state: -1, form: -0.8, coord: -0.5, ctrl: -0.8, scope: -0.6, geo: -0.4, verdict: -0.2, tech: -0.8, opp: -0.4, rel: 0.4, soc: 0.5, nat: 1, cap: -0.5 },
    ['nat', 'rel'],
    'Pan-Arab nationalism, land reform, nationalization of foreign assets and non-alignment, led by progressive army officers and compatible with Islam. Often suppressed local communists.',
    'Gamal Abdel Nasser, Ahmed Ben Bella');
  T('baath', 'gsouth', 'Ba\'athism',
    { rupture: -0.6, arena: 0.2, org: -1, state: -1, form: -1, coord: -0.4, ctrl: -0.6, scope: -0.4, geo: -0.6, verdict: -0.3, tech: -0.7, opp: -0.6, rel: 0.3, soc: 0.6, nat: 1, cap: -0.5 },
    ['nat', 'org'],
    'Unity, freedom, socialism: the Arab nation reborn under a vanguard party, with national unity placed above class struggle.',
    'Michel Aflaq, Salah al-Din al-Bitar');
  T('ujamaa', 'gsouth', 'African Socialism (Ujamaa)',
    { rupture: 0.3, arena: -0.6, org: -0.5, state: -0.8, form: -0.4, coord: -0.4, ctrl: 0.5, scope: -0.3, geo: 0.3, verdict: 0.2, tech: 0.4, opp: -0.2, rel: 0.3, soc: 0.4, nat: 0.8, nv: 0.5, cap: -0.8 },
    ['ctrl'],
    'Socialism rooted in precolonial African communal values rather than class struggle, built around cooperative villages and self-reliance under a one-party democracy.',
    'Julius Nyerere, Kenneth Kaunda, Léopold Senghor');
  T('nkrumah', 'gsouth', 'Nkrumahism',
    { rupture: -0.3, arena: -0.4, org: -0.8, state: -1, form: -0.7, coord: -0.7, ctrl: -0.8, scope: 0.6, geo: -0.3, verdict: -0.4, tech: -0.9, opp: -0.3, nat: 0.9 },
    ['scope', 'tech'],
    'Pan-African socialism: continental union against neo-colonialism, rapid state-led industrialization, and a scientific socialism adapted to Africa (consciencism).',
    'Kwame Nkrumah, Sékou Touré');
  T('sankara', 'gsouth', 'Sankarism',
    { rupture: -1.0, arena: 0.3, org: -0.7, state: -1, form: -0.6, coord: -0.6, ctrl: -0.5, scope: 0.3, geo: 0, verdict: -0.4, tech: 0.5, opp: 0.7, soc: -0.5, nat: 0.9, nv: -0.6 },
    ['opp', 'tech'],
    'Burkina Faso\'s revolution: food self-sufficiency, refusal of debt and aid dependence, reforestation, mass vaccination and women\'s emancipation under a revolutionary military government.',
    'Thomas Sankara');
  T('cabral', 'gsouth', 'Cabralism / Fanonism',
    { rupture: -1.0, arena: 1, org: -0.5, state: -0.5, form: -0.3, coord: -0.5, ctrl: 0.2, scope: 0.5, geo: 0.3, verdict: 0, tech: 0.1, opp: 0.6, nat: 1, nv: -1 },
    ['nat', 'arena'],
    'Armed anticolonial liberation as a cultural and psychological as well as political act, with a warning that the national middle class will betray independence.',
    'Amílcar Cabral, Frantz Fanon, Walter Rodney');
  T('bolivar', 'gsouth', 'Bolivarian Socialism',
    { rupture: 0.4, arena: -0.4, org: -0.3, state: -0.8, form: 0.2, coord: -0.3, ctrl: 0.3, scope: -0.3, geo: -1, verdict: -0.5, tech: -0.8, opp: 0.1, rel: 0.3, nat: 0.8 },
    ['geo', 'rupture'],
    'Socialism of the 21st century: an elected government, oil-funded social programs, communal councils and a regional anti-imperialist alliance.',
    'Hugo Chávez, Nicolás Maduro, Rafael Correa');
  T('mariategui', 'gsouth', 'Indo-American Socialism',
    { rupture: -0.2, arena: 0.3, org: -0.2, state: -0.4, form: 0.3, coord: -0.3, ctrl: 0.7, scope: 0.2, geo: -0.2, verdict: 0.2, tech: 0.7, opp: 0.7, rel: 0.3, nat: 0.6 },
    ['opp', 'tech', 'ctrl'],
    'Socialism rooted in Indigenous Andean communal traditions such as the ayllu, later developed as communitarian socialism and buen vivir with rights for nature.',
    'José Carlos Mariátegui, Álvaro García Linera, Evo Morales');
  T('zapat', 'gsouth', 'Neozapatismo',
    { rupture: -0.4, arena: 1, org: 0.9, state: 0.9, form: 0.7, coord: -0.4, ctrl: 1, scope: 0.6, geo: 0.8, verdict: 0.8, tech: 0.6, opp: 0.9, rel: 0.2, nat: 0.5, nv: -0.2 },
    ['state', 'org'],
    'Indigenous autonomous self-government in Chiapas since 1994: build power from below and change the world without taking state power.',
    'The EZLN, Subcomandante Marcos, John Holloway');
  T('connolly', 'gsouth', 'Republican Socialism',
    { rupture: -1.0, arena: 0.7, org: -0.4, state: -0.7, form: 0.4, coord: -0.6, ctrl: 0.7, scope: 0, geo: 0.4, verdict: 0.3, tech: -0.4, opp: -0.1, rel: 0.3, nat: 1, nv: -0.8 },
    ['nat'],
    'National independence and socialism as one struggle in oppressed nations of the rich world, combined with syndicalist-influenced workers\' power.',
    'James Connolly, the Irish Republican Socialist tradition, the Basque abertzale left');

  /* ---------- Religious, ethical and nonviolent ---------- */
  T('christsoc', 'relig', 'Christian Socialism',
    { rupture: 0.9, arena: -0.7, org: 0.3, state: -0.4, form: 0.9, coord: 0.1, ctrl: 0.2, scope: 0, geo: 0.5, verdict: 0.8, tech: -0.1, opp: 0, rel: 1, soc: 0.4, nv: 0.7, cap: -0.6 },
    ['rel'],
    'Socialism as the practice of Christian love and justice, pursued through democratic reform, unions and cooperatives.',
    'F. D. Maurice, Walter Rauschenbusch, Keir Hardie, R. H. Tawney');
  T('libtheo', 'relig', 'Liberation Theology',
    { rupture: -0.3, arena: 0.4, org: 0.4, state: -0.3, form: 0.4, coord: -0.4, ctrl: 0.4, scope: 0.4, geo: 0.2, verdict: 0.3, tech: 0.2, opp: 0.4, rel: 1, soc: 0.2, nat: 0.4, nv: 0 },
    ['rel'],
    'A preferential option for the poor, using Marxist social analysis inside Christian faith and organizing through base communities. Some adherents joined armed movements.',
    'Gustavo Gutiérrez, Leonardo Boff, Óscar Romero, Camilo Torres');
  T('islamic', 'relig', 'Islamic Socialism',
    { rupture: 0.2, arena: -0.4, org: -0.2, state: -0.6, form: 0.2, coord: 0.2, ctrl: 0, scope: -0.2, geo: -0.3, verdict: 0.3, tech: -0.2, opp: -0.3, rel: 1, soc: 0.8, nat: 0.5, cap: -0.5 },
    ['rel', 'soc'],
    'Economic justice grounded in Islamic principles such as zakat and the prohibition of interest.',
    'Ali Shariati, Mahmud Taleqani, Zulfikar Ali Bhutto, Muammar Gaddafi (Third Universal Theory)');
  T('ethical', 'relig', 'Ethical Socialism',
    { rupture: 1.0, arena: -0.8, org: 0.2, state: -0.5, form: 1, coord: 0.1, ctrl: 0, scope: -0.3, geo: 0.5, verdict: 0.8, tech: -0.2, opp: 0, rel: 0.3, soc: 0.3, nv: 0.6, cap: -0.7 },
    ['theory', 'rupture'],
    'Socialism justified by fellowship, equality and moral duty rather than by historical laws or class interest.',
    'R. H. Tawney, George Orwell, William Morris');
  T('christanarch', 'relig', 'Christian Anarchism',
    { rupture: 0.2, arena: 0.8, org: 1, state: 1, form: 0.8, coord: -0.6, ctrl: 0.9, scope: 0.6, geo: 1, verdict: 1, tech: 0.7, opp: 0.2, rel: 1, soc: 0.4, nv: 1 },
    ['nv', 'state', 'rel'],
    'The Sermon on the Mount read as a rejection of the state and all coercion, practiced through voluntary poverty, hospitality and nonviolent noncooperation.',
    'Leo Tolstoy, Dorothy Day, Ammon Hennacy, Jacques Ellul');
  T('gandhian', 'relig', 'Gandhian Socialism',
    { rupture: 0.0, arena: 0.7, org: 0.6, state: 0.6, form: 0.7, coord: -0.2, ctrl: 0.8, scope: -0.4, geo: 0.6, verdict: 0.7, tech: 0.9, opp: 0.4, rel: 0.6, soc: 0.3, nat: 0.7, nv: 1 },
    ['nv', 'tech'],
    'Decentralized village self-rule, trusteeship, hand production and simple living, pursued through nonviolent mass resistance. Developed in a secular socialist direction by Lohia and Narayan.',
    'M. K. Gandhi, Vinoba Bhave, Ram Manohar Lohia, Jayaprakash Narayan');

  /* ---------- Ecological ---------- */
  T('ecosoc', 'eco', 'Eco-Socialism',
    { rupture: -0.3, arena: 0.2, org: 0, state: -0.2, form: 0.7, coord: -0.7, ctrl: 0.5, scope: 0.8, geo: 0.6, verdict: 0.6, tech: 0.5, opp: 0.5, nat: 0.1 },
    ['tech', 'coord'],
    'Capitalism\'s drive to accumulate is incompatible with the planet. Democratic ecological planning should replace production for profit and heal the metabolic rift.',
    'Joel Kovel, Michael Löwy, John Bellamy Foster');
  T('degrowth', 'eco', 'Degrowth Communism',
    { rupture: -0.2, arena: 0.3, org: 0.4, state: 0, form: 0.7, coord: -0.5, ctrl: 0.7, scope: 0.7, geo: 0.6, verdict: 0.7, tech: 1, opp: 0.5 },
    ['tech'],
    'Rich economies must shrink their material throughput, replacing consumer abundance with expanded commons, shorter hours and public luxury.',
    'Kohei Saito, Jason Hickel, Giorgos Kallis');
  T('ecolen', 'eco', 'Ecological Leninism',
    { rupture: -1.0, arena: 0.5, org: -0.8, state: -0.9, form: -0.4, coord: -0.9, ctrl: -0.8, scope: 0.4, geo: 0.4, verdict: 0.2, tech: 0.6, opp: 0.2, nv: -0.6 },
    ['state', 'nv'],
    'The climate emergency calls for an ecological war communism: seizing the state, nationalizing fossil capital and forcibly shutting down emissions, with sabotage a legitimate tactic.',
    'Andreas Malm');

  /* ---------- Non-socialist left (boundary results) ---------- */
  T('soclib', 'bound', 'Social Liberalism',
    { rupture: 1.0, arena: -1, org: 0.5, state: -0.3, form: 1, coord: 1, ctrl: -0.3, scope: -0.3, geo: 0.6, verdict: 1, tech: -0.6, opp: 0.6, rel: -0.1, soc: -0.6, nv: 0.7, cap: 0.8 },
    ['cap', 'coord'],
    'Market capitalism with civil liberties, a welfare state and anti-discrimination policy. You agree with socialists on some social questions but not on ownership.',
    'John Rawls, Franklin Roosevelt, modern center-left parties');
  T('progpop', 'bound', 'Progressive Populism',
    { rupture: 1.0, arena: -0.8, org: 0.2, state: -0.7, form: 1, coord: 0.7, ctrl: -0.4, scope: -0.6, geo: 0.4, verdict: 0.9, tech: -0.4, opp: 0.2, soc: 0, nat: 0.3, cap: 0.4 },
    ['cap'],
    'Anti-monopoly, pro-worker reform within capitalism: break up big corporations, regulate finance and expand public programs without abolishing private ownership.',
    'Elizabeth Warren, the Progressive Era reformers, William Jennings Bryan');
})(typeof globalThis !== 'undefined' ? globalThis : window);
