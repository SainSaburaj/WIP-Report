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
 * Suitelet backing the Report Home frontend (Report Home view).
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
define(['N/file', '../Libraries/jj_cm_report_utility.js', '../Models/jj_cm_report_savedsearches.js'],
    /**
     * @param{file} file
     * @param{jjUtil} jjUtil
     * @param{report_model} report_model
     */
    (file, jjUtil, report_model) => {
        /**
        * @description A collection of methods for handling operations related to the WIP Reports.
        */
        const apiMethods = {

            /**
             * Retrieves the Actual WIP Report.
             * @returns {Object} Response with status, reason, and data.
             */
            actualwip(params) {
                let pageSize = params && params.pageSize;
                let cursorId = params && params.cursorId;
                let direction = params && params.direction;
                let filters = {
                    location: params && params.location,
                    department: params && params.department,
                    dateFrom: params && params.dateFrom,
                    dateTo: params && params.dateTo,
                    salesOrderNo: params && params.salesOrderNo,
                    workOrderNo: params && params.workOrderNo,
                    bagNumber: params && params.bagNumber,
                };
                let result = report_model.getActualWIPReport(pageSize, cursorId, direction, filters);

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

            /**
             * Retrieves the department-level SUMMARY of the Actual WIP Report
             * (one row per department + location, quantity/weight columns
             * SUMmed). This is what the frontend loads initially instead of the
             * full detail set. Accepts the same filters as `actualwip`.
             * @returns {Object} Response with status, reason, and data.
             */
            actualwipsummary(params) {
                let filters = {
                    location: params && params.location,
                    department: params && params.department,
                    dateFrom: params && params.dateFrom,
                    dateTo: params && params.dateTo,
                    salesOrderNo: params && params.salesOrderNo,
                    workOrderNo: params && params.workOrderNo,
                    bagNumber: params && params.bagNumber,
                };
                let result = report_model.getActualWIPSummary(filters);

                if (result && result.data && result.data.length) {
                    return {
                        status: "SUCCESS",
                        reason: "ACTUAL_WIP_SUMMARY_LISTED",
                        data: result,
                    };
                }

                return {
                    status: "ERROR",
                    reason: jjUtil.ERROR_STACK.length ? "ERROR" : "NO_ACTUAL_WIP_FOUND",
                    data: result || { data: [] },
                };
            },

            /**
             * Retrieves the full detail rows for a SINGLE department (on-demand
             * expansion of one summary row). `department` names the department
             * to expand; the remaining filters keep the expansion scoped to the
             * currently active report filters.
             * @returns {Object} Response with status, reason, and data.
             */
            actualwipdepartmentdetail(params) {
                let department = params && params.department;
                let filters = {
                    location: params && params.location,
                    dateFrom: params && params.dateFrom,
                    dateTo: params && params.dateTo,
                    salesOrderNo: params && params.salesOrderNo,
                    workOrderNo: params && params.workOrderNo,
                    bagNumber: params && params.bagNumber,
                };
                let result = report_model.getActualWIPDepartmentDetail(department, filters);

                if (result && result.data && result.data.length) {
                    return {
                        status: "SUCCESS",
                        reason: "ACTUAL_WIP_DEPARTMENT_DETAIL_LISTED",
                        data: result,
                    };
                }

                return {
                    status: "ERROR",
                    reason: jjUtil.ERROR_STACK.length ? "ERROR" : "NO_ACTUAL_WIP_FOUND",
                    data: result || { data: [] },
                };
            },

            /**
             * Retrieves the active manufacturing departments (each joined to
             * its active location) that back the Location and Department
             * filter dropdowns.
             * @returns {Object} Response with status, reason, and data.
             */
            manufacturingdepartments() {
                let result = report_model.getManufacturingDepartments();
                return {
                    status: "SUCCESS",
                    reason: "MANUFACTURING_DEPARTMENTS_LISTED",
                    data: result || [],
                };
            },

            /**
             * Retrieves the active Locations, Classifications, and Bins
             * that back the Stock with Date report's Location/Class/Bin
             * Number filter dropdowns.
             * @returns {Object} Response with status, reason, and data.
             */
            stockfilteroptions() {
                let result = report_model.getStockFilterOptions();
                return {
                    status: "SUCCESS",
                    reason: "STOCK_FILTER_OPTIONS_LISTED",
                    data: result || { locations: [], classes: [], bins: [] },
                };
            },

            /**
             * Retrieves the LOCATION-LEVEL SUMMARY of the Stock with Date
             * report (one row per location, quantity/weight columns
             * SUMmed). This is what the frontend loads initially instead of
             * the full Class/Item/Inventory Number/Bin Number detail set.
             * @returns {Object} Response with status, reason, and data.
             */
            stocksummary(params) {
                let filters = {
                    location: params && params.location,
                    class: params && params.class,
                    binNumber: params && params.binNumber,
                    dateTo: params && params.dateTo,
                };
                let paging = {
                    pageIndex: params && params.pageIndex,
                    pageSize: params && params.pageSize,
                };
                let result = report_model.getStockSummary(filters, paging);

                if (result && result.data && result.data.length) {
                    return {
                        status: "SUCCESS",
                        reason: "STOCK_SUMMARY_LISTED",
                        data: result,
                    };
                }

                return {
                    status: "ERROR",
                    reason: jjUtil.ERROR_STACK.length ? "ERROR" : "NO_STOCK_SUMMARY_FOUND",
                    data: result || { data: [], pageIndex: 0, pageSize: 1000, totalResults: 0, pageCount: 0, hasNext: false, hasPrev: false },
                };
            },

            /**
             * Retrieves the full Class/Item/Inventory Number/Bin Number
             * detail rows for a SINGLE location (on-demand expansion of one
             * summary row). `location` is the internal ID of the location to
             * expand; the remaining filters keep the expansion scoped to the
             * currently active report filters.
             * @returns {Object} Response with status, reason, and data.
             */
            stocklocationdetail(params) {
                let location = params && params.location;
                let filters = {
                    class: params && params.class,
                    binNumber: params && params.binNumber,
                    dateTo: params && params.dateTo,
                };
                let paging = {
                    pageIndex: params && params.pageIndex,
                    pageSize: params && params.pageSize,
                };
                let result = report_model.getStockLocationDetail(location, filters, paging);

                if (result && result.data && result.data.length) {
                    return {
                        status: "SUCCESS",
                        reason: "STOCK_LOCATION_DETAIL_LISTED",
                        data: result,
                    };
                }

                return {
                    status: "ERROR",
                    reason: jjUtil.ERROR_STACK.length ? "ERROR" : "NO_STOCK_LOCATION_DETAIL_FOUND",
                    data: result || { data: [], pageIndex: 0, pageSize: 1000, totalResults: 0, pageCount: 0, hasNext: false, hasPrev: false },
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
                        case "actualwipsummary":
                            return apiMethods.actualwipsummary(this.parameters);
                        case "actualwipdepartmentdetail":
                            return apiMethods.actualwipdepartmentdetail(this.parameters);
                        case "manufacturingdepartments":
                            return apiMethods.manufacturingdepartments();
                        case "stockfilteroptions":
                            return apiMethods.stockfilteroptions();
                        case "stocksummary":
                            return apiMethods.stocksummary(this.parameters);
                        case "stocklocationdetail":
                            return apiMethods.stocklocationdetail(this.parameters);
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
