const cds = require('@sap/cds');

const RATES = {
    A: 15, Air: 15,
    S: 5, Sea: 5,
    R: 8, Rail: 8
};

module.exports = cds.service.impl(async function () {
    const { Shipments, Packages } = this.entities;
    
    this.after('READ', Shipments, async (results) => {
        const rows = Array.isArray(results) ? results : [results];
        const shipments = rows.filter(r => r && r.ID);

        if (!shipments.length) return;

        const weights = {};
        const toFetch = shipments.filter(s => !Array.isArray(s.packages)).map(s => s.ID);

        if (toFetch.length) {
            const pkgs = await SELECT.from(Packages).columns('parent_ID', 'weight').where({ parent_ID: { in: toFetch }});
            for (const p of pkgs) {
                weights[p.parent_ID] = (weights[p.parent_ID] || 0) + Number(p.weight || 0);
            }
        }
        
        for (const s of shipments) {
            const totalWeight = Array.isArray(s.packages) ? s.packages.reduce((sum, p) => sum + Number(p.weight || 0), 0) : (weights[s.ID] || 0);
            s.totalWeight = totalWeight;
            s.shippingFee = totalWeight * (RATES[s.mode] || 0);
        }
    });
});