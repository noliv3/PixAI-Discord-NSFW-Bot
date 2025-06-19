const scannerConfig = require('../lib/scannerConfig');

module.exports = {
    name: 'filter',
    async execute(message, args) {
        const { moderatorRoleId } = scannerConfig.get();
        const member = message.guild.members.cache.get(message.author.id);

        const isMod = (moderatorRoleId && member.roles.cache.has(moderatorRoleId)) ||
            member.permissions.has('ManageMessages');

        if (!isMod) return; // Kein Hinweis, keine Antwort

        if (args.length < 2) return;

        const category = args[0];
        const operation = args[1][0];
        const tag = args[1].slice(1).toLowerCase().trim();

        if (!['0', '1', '2', '3'].includes(category) || !['+', '-'].includes(operation) || !tag) return;

        const config = scannerConfig.get();
        if (!config.tagFilters) config.tagFilters = {};
        if (!Array.isArray(config.tagFilters[category])) config.tagFilters[category] = [];

        const list = config.tagFilters[category];

        if (operation === '+') {
            if (!list.includes(tag)) {
                list.push(tag);
                scannerConfig.save();
            }
            return;
        }

        if (operation === '-') {
            const index = list.indexOf(tag);
            if (index !== -1) {
                list.splice(index, 1);
                scannerConfig.save();
            }
        }
    }
};
