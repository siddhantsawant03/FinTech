const axios = require('axios');
const NodeCache = require('node-cache');

const navCache = new NodeCache({ stdTTL: 3600 }); // 1 hour
const schemeCache = new NodeCache({ stdTTL: 86400 }); // 24 hours

// Curated MF universe mapped to our categories
const MF_UNIVERSE = {
  'large_cap_index': [
    { name: 'UTI Nifty 50 Index Fund', amcCode: '128', schemeCode: '120716', amfi: '120716' },
    { name: 'HDFC Index Fund - Nifty 50 Plan', amcCode: '109', schemeCode: '118989', amfi: '118989' },
    { name: 'SBI Nifty Index Fund', amcCode: '111', schemeCode: '103504', amfi: '103504' }
  ],
  'flexi_cap': [
    { name: 'Parag Parikh Flexi Cap Fund', amcCode: '149', schemeCode: '122639', amfi: '122639' },
    { name: 'Quant Flexi Cap Fund', amcCode: '120', schemeCode: '120828', amfi: '120828' },
    { name: 'HDFC Flexi Cap Fund', amcCode: '109', schemeCode: '100270', amfi: '100270' }
  ],
  'mid_cap': [
    { name: 'Motilal Oswal Midcap Fund', amcCode: '147', schemeCode: '130503', amfi: '130503' },
    { name: 'Kotak Emerging Equity Fund', amcCode: '152', schemeCode: '131597', amfi: '131597' },
    { name: 'PGIM India Midcap Opportunities', amcCode: '177', schemeCode: '120594', amfi: '120594' }
  ],
  'small_cap': [
    { name: 'Quant Small Cap Fund', amcCode: '120', schemeCode: '120828', amfi: '120503' },
    { name: 'Nippon India Small Cap Fund', amcCode: '105', schemeCode: '118778', amfi: '118778' },
    { name: 'SBI Small Cap Fund', amcCode: '111', schemeCode: '125494', amfi: '125494' }
  ],
  'large_mid_cap': [
    { name: 'Mirae Asset Large & Midcap Fund', amcCode: '140', schemeCode: '118834', amfi: '118834' },
    { name: 'Canara Robeco Emerging Equities', amcCode: '102', schemeCode: '104073', amfi: '104073' }
  ],
  'balanced_advantage': [
    { name: 'HDFC Balanced Advantage Fund', amcCode: '109', schemeCode: '100359', amfi: '100359' },
    { name: 'ICICI Pru Balanced Advantage Fund', amcCode: '120', schemeCode: '120195', amfi: '120195' },
    { name: 'Edelweiss Balanced Advantage Fund', amcCode: '147', schemeCode: '131567', amfi: '131567' }
  ],
  'multi_asset': [
    { name: 'ICICI Pru Multi Asset Fund', amcCode: '120', schemeCode: '100028', amfi: '100028' },
    { name: 'Quant Multi Asset Fund', amcCode: '155', schemeCode: '120843', amfi: '120843' },
    { name: 'Tata Multi Asset Opportunities Fund', amcCode: '145', schemeCode: '136537', amfi: '136537' }
  ],
  'short_duration': [
    { name: 'HDFC Short Term Debt Fund', amcCode: '109', schemeCode: '119270', amfi: '119270' },
    { name: 'Kotak Bond Short Term Fund', amcCode: '152', schemeCode: '101150', amfi: '101150' },
    { name: 'Axis Short Term Fund', amcCode: '205', schemeCode: '120566', amfi: '120566' }
  ],
  'dynamic_bond': [
    { name: 'IDFC Dynamic Bond Fund', amcCode: '133', schemeCode: '102523', amfi: '102523' },
    { name: 'Kotak Dynamic Bond Fund', amcCode: '152', schemeCode: '101154', amfi: '101154' }
  ],
  'liquid': [
    { name: 'Mirae Asset Cash Management Fund', amcCode: '140', schemeCode: '119553', amfi: '119553' },
    { name: 'SBI Liquid Fund', amcCode: '111', schemeCode: '101396', amfi: '101396' },
    { name: 'HDFC Liquid Fund', amcCode: '109', schemeCode: '101104', amfi: '101104' }
  ],
  'gold_etf': [
    { name: 'SBI Gold Fund', amcCode: '111', schemeCode: '120597', amfi: '120597' },
    { name: 'Nippon India Gold Savings Fund', amcCode: '105', schemeCode: '119229', amfi: '119229' },
    { name: 'HDFC Gold Fund', amcCode: '109', schemeCode: '120380', amfi: '120380' }
  ],
  'banking_psu': [
    { name: 'IDFC Banking & PSU Debt Fund', amcCode: '133', schemeCode: '120614', amfi: '120614' },
    { name: 'Kotak Banking and PSU Debt Fund', amcCode: '152', schemeCode: '120173', amfi: '120173' }
  ]
};

class AMFIService {
  async getAllNavs() {
    const cached = navCache.get('all_navs');
    if (cached) return cached;

    try {
      const res = await axios.get('https://www.amfiindia.com/spages/NAVAll.txt', {
        timeout: 10000
      });

      const navMap = {};
      const lines = res.data.split('\n');
      for (const line of lines) {
        const parts = line.split(';');
        if (parts.length >= 5) {
          const schemeCode = parts[0]?.trim();
          const nav = parseFloat(parts[4]?.trim());
          if (schemeCode && !isNaN(nav)) {
            navMap[schemeCode] = nav;
          }
        }
      }

      navCache.set('all_navs', navMap);
      return navMap;
    } catch (err) {
      console.error('AMFI NAV fetch error:', err.message);
      return {};
    }
  }

  async getMFUniverse() {
    return MF_UNIVERSE;
  }

  async enrichWithNAV(fundList) {
    const navMap = await this.getAllNavs();
    return fundList.map(fund => ({
      ...fund,
      nav: navMap[fund.amfi] || null,
      navDate: new Date().toLocaleDateString('en-IN')
    }));
  }

  // Returns MF recommendations based on allocation needs
  async getRecommendations(categories) {
    const navMap = await this.getAllNavs();
    const recommendations = {};

    for (const category of categories) {
      const funds = MF_UNIVERSE[category] || [];
      recommendations[category] = funds.map(fund => ({
        ...fund,
        category,
        nav: navMap[fund.amfi] || null,
        // Estimated returns (in real app, fetch from AMFI historical data)
        returns: {
          oneYear: null,
          threeYear: null,
          fiveYear: null
        },
        expenseRatio: null, // fetch from MF API
        exitLoad: category === 'liquid' ? '0%' : '1% if < 1 year',
        riskOmeter: this.getRiskOmeter(category),
        minSIP: this.getMinSIP(category),
        amcName: fund.name.split(' ')[0] + ' ' + fund.name.split(' ')[1]
      }));
    }

    return recommendations;
  }

  getRiskOmeter(category) {
    const riskMap = {
      'liquid': 'Low',
      'banking_psu': 'Low to Moderate',
      'short_duration': 'Low to Moderate',
      'dynamic_bond': 'Moderate',
      'balanced_advantage': 'Moderate',
      'multi_asset': 'Moderately High',
      'large_cap_index': 'Very High',
      'large_mid_cap': 'Very High',
      'flexi_cap': 'Very High',
      'mid_cap': 'Very High',
      'small_cap': 'Very High',
      'gold_etf': 'High'
    };
    return riskMap[category] || 'Moderate';
  }

  getMinSIP(category) {
    const sipMap = {
      'liquid': 1000,
      'banking_psu': 500,
      'short_duration': 500,
      'dynamic_bond': 1000,
      'balanced_advantage': 1000,
      'multi_asset': 1000,
      'large_cap_index': 500,
      'large_mid_cap': 1000,
      'flexi_cap': 1000,
      'mid_cap': 1000,
      'small_cap': 500,
      'gold_etf': 500
    };
    return sipMap[category] || 1000;
  }
}

module.exports = new AMFIService();
