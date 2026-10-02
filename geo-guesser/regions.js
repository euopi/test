// Country names and accepted alternatives, keyed by Natural Earth ADM0_A3 code.
// The first entry is the display name; the rest are accepted when typing.
window.COUNTRIES = {
  // Africa
  DZA: ["Algeria"], AGO: ["Angola"], BEN: ["Benin", "Dahomey"], BWA: ["Botswana"],
  BFA: ["Burkina Faso", "Upper Volta"], BDI: ["Burundi"], CPV: ["Cabo Verde", "Cape Verde"],
  CMR: ["Cameroon"], CAF: ["Central African Republic", "CAR"], TCD: ["Chad"], COM: ["Comoros"],
  COG: ["Republic of the Congo", "Congo", "Congo-Brazzaville", "Congo Brazzaville", "Congo Republic", "ROC"],
  COD: ["DR Congo", "Democratic Republic of the Congo", "DRC", "Congo-Kinshasa", "Congo Kinshasa", "Zaire", "DR of the Congo"],
  CIV: ["Côte d'Ivoire", "Ivory Coast", "Cote dIvoire"], DJI: ["Djibouti"], EGY: ["Egypt"],
  GNQ: ["Equatorial Guinea"], ERI: ["Eritrea"], SWZ: ["Eswatini", "Swaziland"], ETH: ["Ethiopia"],
  GAB: ["Gabon"], GMB: ["Gambia", "The Gambia"], GHA: ["Ghana"], GIN: ["Guinea", "Guinea-Conakry"],
  GNB: ["Guinea-Bissau", "Guinea Bissau"], KEN: ["Kenya"], LSO: ["Lesotho"], LBR: ["Liberia"],
  LBY: ["Libya"], MDG: ["Madagascar"], MWI: ["Malawi"], MLI: ["Mali"], MRT: ["Mauritania"],
  MUS: ["Mauritius"], MAR: ["Morocco"], MOZ: ["Mozambique"], NAM: ["Namibia"], NER: ["Niger"],
  NGA: ["Nigeria"], RWA: ["Rwanda"], STP: ["São Tomé and Príncipe", "Sao Tome", "Sao Tome and Principe"],
  SEN: ["Senegal"], SYC: ["Seychelles"], SLE: ["Sierra Leone"], SOM: ["Somalia"],
  ZAF: ["South Africa", "RSA"], SDS: ["South Sudan"], SDN: ["Sudan"], TZA: ["Tanzania"],
  TGO: ["Togo"], TUN: ["Tunisia"], UGA: ["Uganda"], ZMB: ["Zambia"], ZWE: ["Zimbabwe"],
  // Asia
  AFG: ["Afghanistan"], ARM: ["Armenia"], AZE: ["Azerbaijan"], BHR: ["Bahrain"], BGD: ["Bangladesh"],
  BTN: ["Bhutan"], BRN: ["Brunei", "Brunei Darussalam"], KHM: ["Cambodia", "Kampuchea"], CHN: ["China", "PRC", "People's Republic of China"],
  GEO: ["Georgia"], IND: ["India"], IDN: ["Indonesia"], IRN: ["Iran", "Persia"], IRQ: ["Iraq"],
  ISR: ["Israel"], JPN: ["Japan"], JOR: ["Jordan"], KAZ: ["Kazakhstan"], KWT: ["Kuwait"],
  KGZ: ["Kyrgyzstan", "Kyrgyz Republic", "Kirgizia"], LAO: ["Laos", "Lao PDR"], LBN: ["Lebanon"],
  MYS: ["Malaysia"], MDV: ["Maldives"], MNG: ["Mongolia"], MMR: ["Myanmar", "Burma"], NPL: ["Nepal"],
  PRK: ["North Korea", "DPRK", "Korea North"], OMN: ["Oman"], PAK: ["Pakistan"],
  PSX: ["Palestine", "State of Palestine", "Palestinian Territories"], PHL: ["Philippines"], QAT: ["Qatar"],
  SAU: ["Saudi Arabia", "KSA"], SGP: ["Singapore"], KOR: ["South Korea", "Korea", "Republic of Korea", "Korea South", "ROK"],
  LKA: ["Sri Lanka", "Ceylon"], SYR: ["Syria"], TWN: ["Taiwan", "Republic of China", "ROC Taiwan"], TJK: ["Tajikistan"],
  THA: ["Thailand", "Siam"], TLS: ["Timor-Leste", "East Timor", "Timor Leste"], TUR: ["Türkiye", "Turkey", "Turkiye"],
  TKM: ["Turkmenistan"], ARE: ["United Arab Emirates", "UAE", "Emirates"], UZB: ["Uzbekistan"],
  VNM: ["Vietnam", "Viet Nam"], YEM: ["Yemen"],
  // Europe
  ALB: ["Albania"], AND: ["Andorra"], AUT: ["Austria"], BLR: ["Belarus", "Byelorussia"], BEL: ["Belgium"],
  BIH: ["Bosnia and Herzegovina", "Bosnia", "Bosnia-Herzegovina", "BiH"], BGR: ["Bulgaria"], HRV: ["Croatia"],
  CYP: ["Cyprus"], CZE: ["Czechia", "Czech Republic"], DNK: ["Denmark"], EST: ["Estonia"], FIN: ["Finland"],
  FRA: ["France"], DEU: ["Germany"], GRC: ["Greece", "Hellas"], HUN: ["Hungary"], ISL: ["Iceland"],
  IRL: ["Ireland", "Republic of Ireland", "Eire"], ITA: ["Italy"], KOS: ["Kosovo"], LVA: ["Latvia"],
  LIE: ["Liechtenstein"], LTU: ["Lithuania"], LUX: ["Luxembourg"], MLT: ["Malta"], MDA: ["Moldova"],
  MCO: ["Monaco"], MNE: ["Montenegro"], NLD: ["Netherlands", "Holland", "The Netherlands"],
  MKD: ["North Macedonia", "Macedonia"], NOR: ["Norway"], POL: ["Poland"], PRT: ["Portugal"],
  ROU: ["Romania"], RUS: ["Russia", "Russian Federation"], SMR: ["San Marino"], SRB: ["Serbia"],
  SVK: ["Slovakia"], SVN: ["Slovenia"], ESP: ["Spain"], SWE: ["Sweden"], CHE: ["Switzerland"],
  UKR: ["Ukraine"], GBR: ["United Kingdom", "UK", "Great Britain", "Britain", "U.K."],
  VAT: ["Vatican City", "Vatican", "Holy See"],
  // North America
  CAN: ["Canada"], USA: ["United States", "USA", "US", "U.S.", "U.S.A.", "United States of America", "America"],
  MEX: ["Mexico"], BLZ: ["Belize"], CRI: ["Costa Rica"], SLV: ["El Salvador", "Salvador"], GTM: ["Guatemala"],
  HND: ["Honduras"], NIC: ["Nicaragua"], PAN: ["Panama"], ATG: ["Antigua and Barbuda", "Antigua"],
  BHS: ["Bahamas", "The Bahamas"], BRB: ["Barbados"], CUB: ["Cuba"], DMA: ["Dominica"],
  DOM: ["Dominican Republic", "DR"], GRD: ["Grenada"], HTI: ["Haiti"], JAM: ["Jamaica"],
  KNA: ["Saint Kitts and Nevis", "St Kitts", "Saint Kitts", "St Kitts and Nevis"], LCA: ["Saint Lucia", "St Lucia"],
  VCT: ["Saint Vincent and the Grenadines", "St Vincent", "Saint Vincent", "St Vincent and the Grenadines"],
  TTO: ["Trinidad and Tobago", "Trinidad"],
  // South America
  ARG: ["Argentina"], BOL: ["Bolivia"], BRA: ["Brazil", "Brasil"], CHL: ["Chile"], COL: ["Colombia"],
  ECU: ["Ecuador"], GUY: ["Guyana"], PRY: ["Paraguay"], PER: ["Peru"], SUR: ["Suriname", "Surinam"],
  URY: ["Uruguay"], VEN: ["Venezuela"],
  // Oceania
  AUS: ["Australia"], FJI: ["Fiji"], KIR: ["Kiribati"], MHL: ["Marshall Islands"],
  FSM: ["Micronesia", "Federated States of Micronesia", "FSM"], NRU: ["Nauru"], NZL: ["New Zealand", "Aotearoa"],
  PLW: ["Palau"], PNG: ["Papua New Guinea", "PNG"], WSM: ["Samoa", "Western Samoa"],
  SLB: ["Solomon Islands", "Solomons"], TON: ["Tonga"], TUV: ["Tuvalu"], VUT: ["Vanuatu"],
};

// Quiz regions. bbox is [west, south, east, north] in degrees and sets the map frame;
// east may be smaller than west when the frame crosses the 180° meridian.
// Every map uses a Lambert azimuthal equal-area projection centred on its frame.
const R = (s) => s.split(" ");
window.REGION_GROUPS = [
  {
    name: "Africa",
    regions: [
      { id: "africa", name: "All of Africa", bbox: [-26, -36, 60, 38], ids: R("DZA AGO BEN BWA BFA BDI CPV CMR CAF TCD COM COG COD CIV DJI EGY GNQ ERI SWZ ETH GAB GMB GHA GIN GNB KEN LSO LBR LBY MDG MWI MLI MRT MUS MAR MOZ NAM NER NGA RWA STP SEN SYC SLE SOM ZAF SDS SDN TZA TGO TUN UGA ZMB ZWE") },
      { id: "n-africa", name: "North Africa", bbox: [-18, 8, 40, 38], ids: R("DZA EGY LBY MAR SDN TUN") },
      { id: "w-africa", name: "West Africa", bbox: [-26, 3.5, 17, 28], ids: R("BEN BFA CPV CIV GMB GHA GIN GNB LBR MLI MRT NER NGA SEN SLE TGO") },
      { id: "c-africa", name: "Central Africa", bbox: [4, -18.5, 32, 24], ids: R("AGO CMR CAF TCD COG COD GNQ GAB STP") },
      { id: "e-africa", name: "East Africa & the Horn", bbox: [22, -13, 57, 23], ids: R("BDI COM DJI ERI ETH KEN RWA SYC SOM SDS TZA UGA") },
      { id: "s-africa", name: "Southern Africa", bbox: [10, -35.5, 60, -4], ids: R("AGO BWA SWZ LSO MDG MWI MUS MOZ NAM ZAF ZMB ZWE") },
    ],
  },
  {
    name: "Asia",
    regions: [
      { id: "asia", name: "All of Asia", bbox: [25, -11, 150, 56], ids: R("AFG ARM AZE BHR BGD BTN BRN KHM CHN GEO IND IDN IRN IRQ ISR JPN JOR KAZ KWT KGZ LAO LBN MYS MDV MNG MMR NPL PRK OMN PAK PSX PHL QAT SAU SGP KOR LKA SYR TWN TJK THA TLS TUR TKM ARE UZB VNM YEM RUS") },
      { id: "mideast", name: "Middle East", bbox: [24, 11.5, 63.5, 42.5], ids: R("BHR EGY IRN IRQ ISR JOR KWT LBN OMN PSX QAT SAU SYR TUR ARE YEM") },
      { id: "c-asia", name: "Central Asia & the Caucasus", bbox: [39.5, 35, 88, 56], ids: R("ARM AZE GEO KAZ KGZ TJK TKM UZB") },
      { id: "s-asia", name: "South Asia", bbox: [60, -1, 98, 39], ids: R("AFG BGD BTN IND MDV NPL PAK LKA") },
      { id: "e-asia", name: "East Asia", bbox: [73, 18, 146, 54], ids: R("CHN JPN MNG PRK KOR TWN") },
      { id: "se-asia", name: "Southeast Asia", bbox: [92, -11.5, 141.5, 28.5], ids: R("BRN KHM IDN LAO MYS MMR PHL SGP THA TLS VNM") },
    ],
  },
  {
    name: "Europe",
    regions: [
      { id: "europe", name: "All of Europe", bbox: [-25, 34, 50, 71], ids: R("ALB AND AUT BLR BEL BIH BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN ISL IRL ITA KOS LVA LIE LTU LUX MLT MDA MCO MNE NLD MKD NOR POL PRT ROU RUS SMR SRB SVK SVN ESP SWE CHE UKR GBR VAT") },
      { id: "w-europe", name: "Western Europe", bbox: [-11, 41.5, 17.5, 59], ids: R("AUT BEL FRA DEU IRL LIE LUX MCO NLD CHE GBR") },
      { id: "n-europe", name: "Nordic & Baltic", bbox: [-25, 53.5, 32, 71.5], ids: R("DNK EST FIN ISL LVA LTU NOR SWE") },
      { id: "e-europe", name: "Eastern Europe", bbox: [12, 41, 45, 60], ids: R("BLR BGR CZE HUN MDA POL ROU RUS SVK UKR") },
      { id: "s-europe", name: "Southern Europe", bbox: [-10, 34.5, 35, 47.2], ids: R("AND CYP GRC ITA MLT PRT SMR ESP VAT") },
      { id: "balkans", name: "The Balkans", bbox: [13, 34.8, 30, 48.3], ids: R("ALB BIH BGR HRV GRC KOS MNE MKD ROU SRB SVN") },
    ],
  },
  {
    name: "North America",
    regions: [
      { id: "n-america", name: "All of North America", bbox: [-170, 7, -52, 72], ids: R("CAN USA MEX BLZ CRI SLV GTM HND NIC PAN ATG BHS BRB CUB DMA DOM GRD HTI JAM KNA LCA VCT TTO") },
      { id: "c-america", name: "Central America", bbox: [-92.5, 7, -77, 18.6], ids: R("BLZ CRI SLV GTM HND NIC PAN") },
      { id: "caribbean", name: "The Caribbean", bbox: [-85.5, 10, -59, 27.5], ids: R("ATG BHS BRB CUB DMA DOM GRD HTI JAM KNA LCA VCT TTO") },
    ],
  },
  {
    name: "South America",
    regions: [
      { id: "s-america", name: "All of South America", bbox: [-82, -56, -34, 13], ids: R("ARG BOL BRA CHL COL ECU GUY PRY PER SUR URY VEN") },
    ],
  },
  {
    name: "Oceania",
    regions: [
      { id: "oceania", name: "All of Oceania", bbox: [110, -48, -148, 15], ids: R("AUS FJI KIR MHL FSM NRU NZL PLW PNG WSM SLB TON TUV VUT") },
    ],
  },
  {
    name: "Notable groups",
    regions: [
      { id: "eu", name: "European Union", bbox: [-11, 34, 35, 70.5], ids: R("AUT BEL BGR HRV CYP CZE DNK EST FIN FRA DEU GRC HUN IRL ITA LVA LTU LUX MLT NLD POL PRT ROU SVK SVN ESP SWE") },
      { id: "arab", name: "Arab League", bbox: [-18, -13, 60, 38], ids: R("DZA BHR COM DJI EGY IRQ JOR KWT LBN LBY MRT MAR OMN PSX QAT SAU SOM SDN SYR TUN ARE YEM") },
      { id: "soviet", name: "Former Soviet Union", bbox: [20, 35, 170, 75], ids: R("ARM AZE BLR EST GEO KAZ KGZ LVA LTU MDA RUS TJK TKM UKR UZB") },
      { id: "med", name: "Mediterranean Coast", bbox: [-10, 29, 42, 47.5], ids: R("ALB DZA BIH HRV CYP EGY FRA GRC ISR ITA LBN LBY MLT MCO MNE MAR PSX SVN ESP SYR TUN TUR") },
    ],
  },
];
