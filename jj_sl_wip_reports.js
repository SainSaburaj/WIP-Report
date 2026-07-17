/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
/*************************************************************************************************************************
* Dew Diamonds India
*
* DEWIN-400   Order-to-Cash (O2C) System
*
*******************************************************************************;
* Author: Jobin & Jismi

* Date Created: 15-July-2026

* Description:
 * Suitelet backing the WIP Report frontend (Actual WIP Report view).
 * Standalone Suitelet -- requires its own Script/Deployment record in
 * NetSuite, with its SCRIPT_ID/DEPLOY_ID configured as a new endpoint
 * (e.g. WIP_REPORTS_ENDPOINT) in the frontend's constants.js / NetSuite_API.js.

REVISION HISTORY
* @version 1.0 DEWIN-400: 15-July-2026: Created the initial build


* COPYRIGHT © 2026 Jobin & Jismi.
* All rights reserved. This script is a proprietary product of Jobin & Jismi IT Services LLP and is protected by copyright
* law and international treaties. Unauthorized reproduction or distribution of this script, or any portion of it,
* may result in severe civil and criminal penalties and will be prosecuted to the maximum extent possible under law.
************************************************************************************************************************/
define(['N/file', '../Libraries/jj_cm_wip_utility.js', '../Models/jj_cm_wip_savedsearches.js'],
    /**
     * @param{file} file
     * @param{jjUtil} jjUtil
     * @param{wip_model} wip_model
     */
    (file, jjUtil, wip_model) => {
        /**
        * @description A collection of methods for handling operations related to the WIP Reports.
        */
        const apiMethods = {

            /**
             * Retrieves the Actual WIP Report.
             * @returns {Object} Response with status, reason, and data.
             */
            actualwip(params) {
                let page = params && params.page;
                let pageSize = params && params.pageSize;
                let result = wip_model.getActualWIPReport(page, pageSize);

                if (result && result.data && result.data.length) {
                    return {
                        status: "SUCCESS",
                        reason: "ACTUAL_WIP_LISTED",
                        data: result,
                    };
                }

                return {
                    status: "ERROR",
                    reason: jjUtil.ERROR_STACK.length ? "ERROR" : "NO_ACTUAL_WIP_FOUND",
                    data: result || null,
                };
            },

        }
        jjUtil.applyTryCatch(apiMethods, 'apiMethods');

        const rootContext = {
            scriptContext: null,
            method: null,
            headers: null,
            parameters: null,
            body: null,
            /**
             * @description To initialize the export Object with the Suitelet methods and parameters and body
             * @param {Object} scriptContext
            */
            init(scriptContext) {
                this.scriptContext = scriptContext;
                this.method = scriptContext.request.method;
                this.headers = scriptContext.request.headers;
                this.parameters = scriptContext.request.parameters;
                this.body = scriptContext.request.body;
                this.parseJSON();
            },
            parseJSON() {
                try {
                    if (this.body) {
                        this.body = JSON.parse(this.body);
                    }
                }
                catch (err) {
                    this.body = "CANNOT PARSE BODY     ---" + this.body;
                }
            },
            /**
            * @description To route request based on API Type
            */
            routeRequest() {
                log.debug("this.parameters.apiType", this.parameters.apiType);
                if (jjUtil.checkForParameter(this.parameters.apiType)) {
                    switch (this.parameters.apiType) {
                        case "loadPage":
                            return "";
                        case "actualwip":
                            return apiMethods.actualwip(this.parameters);
                        default:
                            return { status: 'ERROR', reason: 'INVALID_APITYPE', data: null };
                    }
                }
            },
            /* @description Structures and sends the response. All responses will be sent from this common point
            * @param responseObj - contains status, reason and data
            * @returns {boolean}
            */
            sendResponse(responseObj) {
                let returnVal;
                const wrapInEscapedBody = (data) => {
                    return encodeURIComponent(JSON.stringify(data));
                };
                if (this.method === 'GET') {
                    // NOTE: this is the Vite dev-time index.html shell. Replace with the
                    // built dist/index.html (with hashed asset paths from `vite build`)
                    // once the frontend is built and uploaded to the File Cabinet.
                    let filePath = '../Views/FrontEndSPA/index.html';
                    let fileObj = file.load({ id: filePath });
                    if (fileObj) {
                        let fileContent = fileObj.getContents();
                        this.scriptContext.response.headers['Content-Type'] = 'text/html';
                        return this.scriptContext.response.write(fileContent);
                    } else {
                        return this.scriptContext.response.write('HTML file not found');
                    }
                }
                if (this.method === 'POST') {
                    returnVal = {
                        status: responseObj.status,
                        reason: responseObj.reason,
                        data: wrapInEscapedBody(responseObj.data)
                    }
                    return this.scriptContext.response.write(`${JSON.stringify(returnVal)}`, true)
                }
                return this.scriptContext.response.write(`Invalid method: ${this.method}`, true)
            }
        }
        jjUtil.applyTryCatch(rootContext, 'rootContext');

        /**
         * Defines the Suitelet script trigger point.
         * @param {Object} scriptContext
         * @param {ServerRequest} scriptContext.request - Incoming request
         * @param {ServerResponse} scriptContext.response - Suitelet response
         * @since 2015.2
         */
        const onRequest = (scriptContext) => {
            rootContext.init(scriptContext);
            return rootContext.sendResponse(rootContext.routeRequest())
        }
        return { onRequest }
    });
