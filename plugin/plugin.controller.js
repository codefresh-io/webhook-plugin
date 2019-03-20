const config = require('../config');
const PluginLogic = require('./plugin.logic');
const Codefresh = require('../helpers/codefresh.api');

class PluginController {

    constructor() {
        this.sendNotify = this.sendNotify.bind(this);

        this._ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH'];
    }

    /**
     * get data, ready to use in templates
     * @return {Promise<{build: {trigger: *, initiator: *, id: *, timestamp: *, url: *}, repo: {owner: *, name: *}, commit: {author: *, url: *, message: *}, revision: *, branch: *, apiKey: *, causes: *, status: string}>}
     * @private
     */
    async _getData() {
        const buildCauses = await Codefresh.buildCauses(Codefresh.info.build.id, Codefresh.info.apiKey);

        return {
            ...Codefresh.info,
            causes: buildCauses,
            status: buildCauses.length ? 'failed' : 'success',
        };
    }

    /**
     * validate config variables
     * @private
     */
    _validate() {
        if (!config.url) {
            console.error('WEBHOOK_URL variable should exist');
            process.exit(1);
        }
    }

    async sendNotify() {
        this._validate();
        const isCorrectMethod = config.method && this._ALLOWED_METHODS.includes(config.method);
        const method = isCorrectMethod ? config.method : 'POST';
        const body = config.body;
        const defaultHeaders = {
            'Content-Type': 'application/json',
        };

        const tplData = await this._getData();
        console.log(tplData);

        return await PluginLogic.getRequest({
            uri: config.url,
            method,
            body: body || JSON.stringify(tplData, null, 2),
            tplData,
            defaultHeaders,
        });

    }
}

module.exports = new PluginController();
