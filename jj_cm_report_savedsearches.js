/**
 * @NApiVersion 2.1
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
 * Model layer for the Report Home (Work In Progress) Reports. Contains data-access
 * functions that query NetSuite (via SuiteQL) for the Report Home,
 * returning plain arrays of row objects to the Suitelet.

REVISION HISTORY
* @version 1.0 DEWIN-400: 15-July-2026: Created the initial build


* COPYRIGHT © 2026 Jobin & Jismi.
* All rights reserved. This script is a proprietary product of Jobin & Jismi IT Services LLP and is protected by copyright
* law and international treaties. Unauthorized reproduction or distribution of this script, or any portion of it,
* may result in severe civil and criminal penalties and will be prosecuted to the maximum extent possible under law.
************************************************************************************************************************/
define(['N/query', 'N/search', '../Libraries/jj_cm_report_utility.js'],
    /**
     * @param{query} query
     * @param{search} search
     * @param{jjUtil} jjUtil
     */
    (query, search, jjUtil) => {

        const runQuery = (sqlQuery, queryName, params, maxResults) => {
            queryName = queryName || 'UnnamedQuery';
            try {
                if (!sqlQuery) { log.error('runQuery - ERROR: sqlQuery is null or undefined'); return []; }
                const results = [];
                const PAGE_SIZE = 500;
                let pageIndex = 0;
                let pagedData;
                pagedData = query.runSuiteQLPaged({ query: sqlQuery, params: params || [], pageSize: PAGE_SIZE });
                do {
                    if (pageIndex === 0 && pagedData.pageRanges.length === 0) { break; }
                    const page = pagedData.fetch({ index: pageIndex });
                    const mapped = page.data.asMappedResults();
                    for (let i = 0; i < mapped.length; i++) {
                        results.push(mapped[i]);
                        if (maxResults && results.length >= maxResults) { return results; }
                    }
                    pageIndex++;
                } while (pagedData && pageIndex < pagedData.pageRanges.length);
                return results;
            } catch (error) {
                log.error('runQuery - Error in ' + queryName, error);
                return [];
            }
        };

        // Non-paged SuiteQL runner. Used ONLY for the department summary
        // (GROUP BY aggregate) query. NetSuite's runSuiteQLPaged reliably
        // throws UNEXPECTED_ERROR while fetching page 0 of this specific
        // join once a GROUP BY is added -- paged fetch depends on stable
        // per-row cursoring that an aggregated result set doesn't have.
        // Plain (non-paged) runSuiteQL executes the identical SQL without
        // issue. Safe here because the summary result is tiny (one row per
        // department), far under the single-call row cap.
        const runQueryUnpaged = (sqlQuery, queryName, params) => {
            queryName = queryName || 'UnnamedQuery';
            try {
                if (!sqlQuery) { log.error('runQueryUnpaged - ERROR: sqlQuery is null or undefined'); return []; }
                let resultSet = query.runSuiteQL({ query: sqlQuery, params: params || [] });
                return resultSet ? resultSet.asMappedResults() : [];
            } catch (error) {
                log.error('runQueryUnpaged - Error in ' + queryName, error);
                return [];
            }
        };

        /**
         * Builds the shared inner SELECT (Actual WIP source data, unfiltered,
         * unpaged) plus its fixed positional params. Reused by both the report
         * fetch and any COUNT/aggregate query so the join logic only lives in
         * one place.
         *
         * All joins use ANSI LEFT JOIN syntax. The original saved-search-export
         * version of this query used Oracle-style "(+)" outer joins throughout,
         * which SuiteQL does not reliably support once any pagination wrapping
         * (ROWNUM subquery, OFFSET/FETCH) is layered on top -- that combination
         * produced generic UNEXPECTED_ERRORs specifically inside NetSuite's
         * paged-result fetch. Converting every join to ANSI syntax removes that
         * failure mode entirely.
         *
         * @param {{cursorId?: number, direction?: 'next'|'prev'}} [seek] - keyset
         *   pagination cursor. When set, adds a WHERE condition on
         *   CUSTOMRECORD_JJ_BAG_GENERATION.ID (a stable, unique, indexed key)
         *   so NetSuite can seek directly to the requested window instead of
         *   scanning/counting through every prior row (which is what OFFSET
         *   and ROWNUM both do under the hood).
         * @param {string} [selectOverride] - when set, replaces the full SELECT
         *   column list with this raw SQL (e.g. "COUNT(*) AS total_count") so a
         *   COUNT/aggregate query can share the exact same FROM/WHERE/joins.
         * @param {{location?: string, department?: string, dateFrom?: string,
         *   dateTo?: string, salesOrderNo?: string, workOrderNo?: string,
         *   bagNumber?: string}} [filters] - optional user-supplied filters,
         *   appended to the WHERE clause as additional AND conditions with
         *   bound params (never string-concatenated into the SQL itself).
         * @returns {{innerQuery: string, baseParams: Array<string>}}
         */
        const buildActualWIPInnerQuery = (seek, selectOverride, filters) => {
            seek = seek || {};
            filters = filters || {};
            let seekClause = '';
            
            if (seek.cursorId) {
                seekClause = seek.direction === 'prev'
                    ? 'AND CUSTOMRECORD_JJ_BAG_GENERATION.ID < ?'
                    : 'AND CUSTOMRECORD_JJ_BAG_GENERATION.ID > ?';
            }
            let filterClauses = [];
            let filterParams = [];
            if (filters.location) {
                filterClauses.push("AND BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_location) = ?");
                filterParams.push(filters.location);
            }
            if (filters.department) {
                filterClauses.push("AND BUILTIN.DF(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_present_dept) = ?");
                filterParams.push(filters.department);
            }
            if (filters.dateFrom) {
                filterClauses.push("AND TRUNC(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_order_date) >= TO_DATE(?, 'YYYY-MM-DD')");
                filterParams.push(filters.dateFrom);
            }
            if (filters.dateTo) {
                filterClauses.push("AND TRUNC(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_order_date) <= TO_DATE(?, 'YYYY-MM-DD')");
                filterParams.push(filters.dateTo);
            }
            if (filters.salesOrderNo) {
                filterClauses.push("AND UPPER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.tranid_0) LIKE UPPER(?)");
                filterParams.push('%' + filters.salesOrderNo + '%');
            }
            if (filters.workOrderNo) {
                filterClauses.push("AND UPPER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.tranid_1) LIKE UPPER(?)");
                filterParams.push('%' + filters.workOrderNo + '%');
            }
            if (filters.bagNumber) {
                filterClauses.push("AND UPPER(CUSTOMRECORD_JJ_BAG_GENERATION.name) LIKE UPPER(?)");
                filterParams.push('%' + filters.bagNumber + '%');
            }
            let orderAndFetchClause = seek.pageSize
                ? `ORDER BY CUSTOMRECORD_JJ_BAG_GENERATION.ID ${seek.direction === 'prev' ? 'DESC' : 'ASC'} FETCH NEXT ${Number(seek.pageSize) + 1} ROWS ONLY`
                : (seek.orderOnly
                    ? 'ORDER BY CUSTOMRECORD_JJ_BAG_GENERATION.ID ASC'
                    : '');
            let selectList = selectOverride || `
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_GENERATION.ID) AS bag_generation_id,
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_so) AS custrecord_jj_bagcore_so,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_location)) AS location,
                      BUILTIN_RESULT.TYPE_STRING(CASE WHEN CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_exit IS NULL THEN CUSTOMRECORD_JJ_OPERATIONS_SUB.firstname END) AS manufacturer,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.firstname_0_0) AS sales_executive,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.tranid_0) AS so_tranid,
                      BUILTIN_RESULT.TYPE_DATE(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_order_date) AS order_date,
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custbody_jj_wo_ring_size) AS ring_size,
                      BUILTIN_RESULT.TYPE_FLOAT(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_order_date)) AS wo_ageing,
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_wo) AS custrecord_jj_bagcore_wo,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.tranid_1) AS wo_tranid,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_qty) AS ordered_quantity,
                      BUILTIN_RESULT.TYPE_DATE(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_time) AS bag_generation_date,
                      BUILTIN_RESULT.TYPE_DATE(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_duedate) AS delivery_date,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN TRUNC(CURRENT_DATE) > TRUNC(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_duedate) THEN TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_duedate) ELSE 0 END) AS overdue_days,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN TRUNC(CURRENT_DATE) > TRUNC(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_time) THEN TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_time) ELSE 0 END) AS production_delay,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_order_type)) AS order_type,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_customer_name) AS customer_name,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_present_dept)) AS present_department,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.memo_0) AS so_memo_1,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.otherrefnum_0) AS po_number,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custitem_jj_category_0)) AS category,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_category_code_0) AS category_code,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custitem_jj_sub_category_0)) AS sub_category,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_kt_col)) AS design,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_GENERATION.name) AS bag_name,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custitem_jj_stock_type_0)) AS stock_type,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN CUSTOMRECORD_JJ_BAG_GENERATION.name IS NOT NULL THEN 1 ELSE 0 END) AS no_of_bags,
                      BUILTIN_RESULT.TYPE_FLOAT(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_qty) AS quantity_per_bag,
                      BUILTIN_RESULT.TYPE_DATETIME(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.created_0) AS created,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_item)) AS component_item,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_group_0)) AS stone_quality_group,
                      BUILTIN_RESULT.TYPE_FLOAT(
                        ((CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END)
                        * TO_NUMBER(NVL(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_metal_purity_percent_0, '0'))) / 100
                      ) AS actual_metal_pure_weight,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_metal_color_0) || BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_color_0)) AS metal_stone_color,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_metal_quality_0) || BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_0)) AS metal_stone_quality,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS actual_diamond_weight_ct,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' AND BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_group_0) = 'PARTY DIAMOND QUALITY' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS party_diamond_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_entry)) AS last_move_days,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.companyname) AS companyname,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 = 6 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_actual_pieces_info END) AS expected_diamond_pieces,
                      BUILTIN_RESULT.TYPE_FLOAT(
                        NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)
                        + NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 = 6 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)
                        + NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 = 7 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)
                      ) AS expected_gross_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(
                        CASE
                          WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty
                          WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 IN (6, 7) AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty
                          ELSE 0
                        END
                      ) AS expected_component_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.created_0)) AS lot_metal_issue_days,
                      BUILTIN_RESULT.TYPE_FLOAT(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.75 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) AS expected_metal_pure_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) AS expected_net_weight,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.memo_1) AS so_memo_2
            `;
            let innerQuery = `
                    SELECT
                      ${selectList}
                    FROM
                      CUSTOMRECORD_JJ_BAG_GENERATION
                    LEFT JOIN
                      (SELECT
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_bag_name AS custrecord_jj_bagcoremat_bag_name,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_bag_name AS custrecord_jj_bagcoremat_bag_name_join,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_actual_pieces_info AS custrecord_jj_actual_pieces_info,
                        CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.created AS created_0,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_item AS custrecord_jj_bagcoremat_item,
                        CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.id_0_0_0 AS id_0_0_0_0,
                        item_SUB_0.custitem_jj_stone_quality_group AS custitem_jj_stone_quality_group_0,
                        item_SUB_0.custitem_jj_metal_purity_percent AS custitem_jj_metal_purity_percent_0,
                        item_SUB_0.id_0_0 AS id_0_0_1,
                        CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.custrecord_jj_quantity AS custrecord_jj_quantity_0,
                        item_SUB_0.CLASS AS class_0,
                        item_SUB_0.custitem_jj_metal_color AS custitem_jj_metal_color_0,
                        item_SUB_0.custitem_jj_stone_color AS custitem_jj_stone_color_0,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_qty AS custrecord_jj_bagcoremat_qty,
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_newly_add_line AS custrecord_jj_bagcoremat_newly_add_line,
                        item_SUB_0.custitem_jj_metal_quality AS custitem_jj_metal_quality_0,
                        item_SUB_0.custitem_jj_stone_quality AS custitem_jj_stone_quality_0,
                        item_SUB_0.id_join_0 AS id_join_0_0,
                        CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.custrecord_jj_pieces AS custrecord_jj_pieces_0
                      FROM
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS
                      LEFT JOIN
                        (SELECT
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_bag_core_material AS custrecord_jj_bag_core_material,
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_bag_core_material AS custrecord_jj_bag_core_material_join,
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.created AS created,
                          CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB_0.id_0_0 AS id_0_0_0,
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_quantity AS custrecord_jj_quantity,
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_pieces AS custrecord_jj_pieces
                        FROM
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS
                        LEFT JOIN
                          (SELECT
                            CUSTOMRECORD_JJ_BAGCORE_MATERIALS_0.ID AS id_0,
                            CUSTOMRECORD_JJ_BAGCORE_MATERIALS_0.ID AS id_join,
                            item_SUB.id_0 AS id_0_0
                          FROM
                            CUSTOMRECORD_JJ_BAGCORE_MATERIALS CUSTOMRECORD_JJ_BAGCORE_MATERIALS_0
                          LEFT JOIN
                            (SELECT
                              item.ID AS ID,
                              item.ID AS id_join,
                              classification.ID AS id_0
                            FROM
                              item
                            LEFT JOIN
                              classification
                            ON
                              item.CLASS = classification.ID
                            ) item_SUB
                          ON
                            CUSTOMRECORD_JJ_BAGCORE_MATERIALS_0.custrecord_jj_bagcoremat_item = item_SUB.ID
                          ) CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB_0
                        ON
                          CUSTOMRECORD_JJ_BAG_LOT_DETAILS.custrecord_jj_bag_core_material = CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB_0.id_0
                        ) CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB
                      ON
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.ID = CUSTOMRECORD_JJ_BAG_LOT_DETAILS_SUB.custrecord_jj_bag_core_material
                      LEFT JOIN
                        (SELECT
                          item_0.ID AS id_0,
                          item_0.ID AS id_join,
                          item_0.custitem_jj_stone_quality_group AS custitem_jj_stone_quality_group,
                          item_0.custitem_jj_metal_purity_percent AS custitem_jj_metal_purity_percent,
                          classification_SUB.id_0 AS id_0_0,
                          item_0.CLASS AS CLASS,
                          item_0.custitem_jj_metal_color AS custitem_jj_metal_color,
                          item_0.custitem_jj_stone_color AS custitem_jj_stone_color,
                          item_0.custitem_jj_metal_quality AS custitem_jj_metal_quality,
                          item_0.custitem_jj_stone_quality AS custitem_jj_stone_quality,
                          classification_SUB.id_join AS id_join_0
                        FROM
                          item item_0
                        LEFT JOIN
                          (SELECT
                            classification_0.ID AS ID,
                            classification_0.ID AS id_join,
                            classification_1.ID AS id_0
                          FROM
                            classification classification_0
                          LEFT JOIN
                            classification classification_1
                          ON
                            classification_0.PARENT = classification_1.ID
                          ) classification_SUB
                        ON
                          item_0.CLASS = classification_SUB.ID
                        ) item_SUB_0
                      ON
                        CUSTOMRECORD_JJ_BAGCORE_MATERIALS.custrecord_jj_bagcoremat_item = item_SUB_0.id_0
                      ) CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB
                    ON
                      CUSTOMRECORD_JJ_BAG_GENERATION.ID = CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_bag_name
                    LEFT JOIN
                      (SELECT
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.ID AS id_1,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.ID AS id_join,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_so AS custrecord_jj_bagcore_so,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_location AS custrecord_jj_bagcore_location,
                        transaction_SUB.firstname_0 AS firstname_0_0,
                        transaction_SUB.enddate AS enddate_0,
                        transaction_SUB.firstname_0_0 AS firstname_0_0_0,
                        transaction_SUB.tranid AS tranid_0,
                        transaction_SUB.custentity_jj_entity_customer_code_0 AS custentity_jj_entity_customer_code_0_0,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_order_date AS custrecord_jj_bagcore_order_date,
                        workOrder.custbody_jj_wo_ring_size AS custbody_jj_wo_ring_size,
                        transaction_SUB.quantitybilled AS quantitybilled_0,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_wo AS custrecord_jj_bagcore_wo,
                        transaction_0.tranid AS tranid_1,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_kt_col AS custrecord_jj_bagcore_kt_col,
                        transaction_SUB.item AS item_0,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_qty AS custrecord_jj_bagcore_qty,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_duedate AS custrecord_jj_bagcore_duedate,
                        transaction_SUB.firstname_1 AS firstname_1_0,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_order_type AS custrecord_jj_bagcore_order_type,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_customer_name AS custrecord_jj_bagcore_customer_name,
                        item_SUB_1.custitem_jj_metal_color AS custitem_jj_metal_color_0,
                        transaction_SUB.memo AS memo_0,
                        transaction_SUB.otherrefnum AS otherrefnum_0,
                        item_SUB_1.custitem_jj_category AS custitem_jj_category_0,
                        item_SUB_1.custrecord_jj_category_code AS custrecord_jj_category_code_0,
                        item_SUB_1.custitem_jj_sub_category AS custitem_jj_sub_category_0,
                        item_SUB_1.custrecord_jj_sub_category_code AS custrecord_jj_sub_category_code_0,
                        item_SUB_1.custrecord_jj_sub_cate_types AS custrecord_jj_sub_cate_types_0,
                        item_SUB_1.custitem_jj_stock_type AS custitem_jj_stock_type_0,
                        Customer.companyname AS companyname,
                        Customer.custentity_jj_entity_customer_code AS custentity_jj_entity_customer_code_1,
                        CUSTOMRECORD_JJ_SUB_CATEGORY.custrecord_jj_sub_category_code AS custrecord_jj_sub_category_code_1,
                        salesOrder.memo AS memo_1,
                        salesOrder.custbody_jj_customer_shop_code AS custbody_jj_customer_shop_code,
                        workOrder.status AS status,
                        workOrder.trandate AS trandate,
                        salesOrder.trandate AS trandate_0,
                        transaction_0.status AS status_crit,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.isinactive AS isinactive_crit,
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_is_rejected AS custrecord_jj_bagcore_is_rejected_crit,
                        transaction_SUB.mainline_crit AS mainline_crit_0
                      FROM
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING
                      LEFT JOIN
                        Customer
                      ON
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_customer = Customer.ID
                      LEFT JOIN
                        CUSTOMRECORD_JJ_SUB_CATEGORY
                      ON
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_item_subcategory = CUSTOMRECORD_JJ_SUB_CATEGORY.ID
                      LEFT JOIN
                        (SELECT
                          item_1.ID AS ID,
                          item_1.ID AS id_join,
                          item_1.custitem_jj_metal_color AS custitem_jj_metal_color,
                          item_1.custitem_jj_category AS custitem_jj_category,
                          CUSTOMRECORD_JJ_CATEGORY.custrecord_jj_category_code AS custrecord_jj_category_code,
                          item_1.custitem_jj_sub_category AS custitem_jj_sub_category,
                          CUSTOMRECORD_JJ_SUB_CATEGORY_0.custrecord_jj_sub_category_code AS custrecord_jj_sub_category_code,
                          CUSTOMRECORD_JJ_SUB_CATEGORY_0.custrecord_jj_sub_cate_types AS custrecord_jj_sub_cate_types,
                          item_1.custitem_jj_stock_type AS custitem_jj_stock_type
                        FROM
                          item item_1
                        LEFT JOIN
                          CUSTOMRECORD_JJ_CATEGORY
                        ON
                          item_1.custitem_jj_category = CUSTOMRECORD_JJ_CATEGORY.ID
                        LEFT JOIN
                          CUSTOMRECORD_JJ_SUB_CATEGORY CUSTOMRECORD_JJ_SUB_CATEGORY_0
                        ON
                          item_1.custitem_jj_sub_category = CUSTOMRECORD_JJ_SUB_CATEGORY_0.ID
                        ) item_SUB_1
                      ON
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_kt_col = item_SUB_1.ID
                      LEFT JOIN
                        salesOrder
                      ON
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_so = salesOrder.ID
                      LEFT JOIN
                        (SELECT
                          TRANSACTION.ID AS id_0,
                          TRANSACTION.ID AS id_join,
                          Customer_SUB.firstname AS firstname_0,
                          TRANSACTION.enddate AS enddate,
                          Customer_SUB.firstname_0 AS firstname_0_0,
                          TRANSACTION.tranid AS tranid,
                          Customer_SUB.custentity_jj_entity_customer_code AS custentity_jj_entity_customer_code_0,
                          transactionLine.quantitybilled AS quantitybilled,
                          transactionLine.item AS item,
                          employee.firstname AS firstname_1,
                          TRANSACTION.memo AS memo,
                          TRANSACTION.otherrefnum AS otherrefnum,
                          transactionLine.mainline AS mainline_crit
                        FROM
                          TRANSACTION
                        LEFT JOIN
                          employee
                        ON
                          TRANSACTION.employee = employee.ID
                        LEFT JOIN
                          (SELECT
                            Customer_0.ID AS ID,
                            Customer_0.ID AS id_join,
                            employee_0.firstname AS firstname,
                            employee_1.firstname AS firstname_0,
                            Customer_0.custentity_jj_entity_customer_code AS custentity_jj_entity_customer_code
                          FROM
                            Customer Customer_0
                          LEFT JOIN
                            employee employee_0
                          ON
                            Customer_0.custentity1 = employee_0.ID
                          LEFT JOIN
                            employee employee_1
                          ON
                            Customer_0.salesrep = employee_1.ID
                          ) Customer_SUB
                        ON
                          TRANSACTION.entity = Customer_SUB.ID
                        JOIN
                          transactionLine
                        ON
                          TRANSACTION.ID = transactionLine.TRANSACTION
                        ) transaction_SUB
                      ON
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_so = transaction_SUB.id_0
                      LEFT JOIN
                        TRANSACTION transaction_0
                      ON
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_wo = transaction_0.ID
                      LEFT JOIN
                        workOrder
                      ON
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING.custrecord_jj_bagcore_wo = workOrder.ID
                      ) CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB
                    ON
                      CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_bagcore = CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.id_1
                    LEFT JOIN
                      (SELECT
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_bagno AS custrecord_jj_oprtns_bagno,
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_bagno AS custrecord_jj_oprtns_bagno_join,
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_exit AS custrecord_jj_oprtns_exit,
                        employee_2.firstname AS firstname,
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_entry AS custrecord_jj_oprtns_entry,
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_exit AS custrecord_jj_oprtns_exit_crit
                      FROM
                        CUSTOMRECORD_JJ_OPERATIONS
                      LEFT JOIN
                        employee employee_2
                      ON
                        CUSTOMRECORD_JJ_OPERATIONS.custrecord_jj_oprtns_employee = employee_2.ID
                      ) CUSTOMRECORD_JJ_OPERATIONS_SUB
                    ON
                      CUSTOMRECORD_JJ_BAG_GENERATION.ID = CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_bagno
                    WHERE
                      (NVL(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_merge, 'F') = ? AND (NOT(
                        CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.status_crit IN ('WorkOrd:G', 'WorkOrd:C', 'WorkOrd:H')
                      ) OR CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.status_crit IS NULL) AND NVL(CUSTOMRECORD_JJ_BAG_GENERATION.isinactive, 'F') = ? AND NVL(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_split, 'F') = ? AND NVL(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_is_rejected, 'F') = ? AND NVL(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.isinactive_crit, 'F') = ? AND NVL(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_is_rejected_crit, 'F') = ? AND CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.mainline_crit_0 = ? AND CASE WHEN CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_exit_crit IS NULL THEN 1 ELSE 0 END IN ('1'))
                      ${filterClauses.join(' ')}
                      ${seekClause}
                    ${seek.groupByClause || ''}
                    ${orderAndFetchClause}
                `;

            return { innerQuery, baseParams: ['F', 'F', 'F', 'F', 'F', 'F', 'T'].concat(filterParams) };
        };

        /**
         * Keyset (seek) pagination over the Actual WIP Report.
         *
         * Instead of a page number, the caller passes the ID of the last row
         * seen (cursorId) and a direction ('next' or 'prev'). NetSuite can seek
         * directly to rows greater/less than that ID using the query's own
         * ORDER BY + WHERE, instead of scanning/counting through every row
         * before it -- which is what both OFFSET/FETCH and ROWNUM do, and why
         * deeper pages kept getting slower. Every page therefore loads in
         * roughly the same amount of time regardless of how far into the
         * dataset it is.
         *
         * @param {number} pageSize - number of rows per page.
         * @param {number} [cursorId] - CUSTOMRECORD_JJ_BAG_GENERATION.ID of the
         *   last row on the previous page (omit for the first page).
         * @param {'next'|'prev'} [direction] - which way to seek from cursorId.
         * @param {{location?: string, department?: string, dateFrom?: string,
         *   dateTo?: string, salesOrderNo?: string, workOrderNo?: string,
         *   bagNumber?: string}} [filters] - optional user-supplied filters.
         * @returns {{data: Array<Object>, hasNext: boolean, hasPrev: boolean,
         *            totalCount?: number, totalPages?: number}}
         */
        const getActualWIPReport = (pageSize, cursorId, direction, filters) => {
            try {
                pageSize = Number(pageSize) > 0 ? Number(pageSize) : 20;
                cursorId = cursorId ? Number(cursorId) : null;
                direction = direction === 'prev' ? 'prev' : 'next';
                filters = filters || {};

                // Only the very first request (no cursorId, i.e. initial page
                // load) pays for a full COUNT(*) scan to report the total page
                // count. Every subsequent Next/Previous call always carries a
                // cursorId and skips this entirely, so keyset pagination speed
                // is unaffected.
                let totalCount = null;
                let totalPages = null;
                if (!cursorId) {
                    let { innerQuery: countQuery, baseParams: countBaseParams } = buildActualWIPInnerQuery(null, 'COUNT(*) AS total_count', filters);
                    let countResult = runQuery(countQuery, 'getActualWIPReport_count', countBaseParams);
                    totalCount = (countResult[0] && Number(countResult[0].total_count)) || 0;
                    totalPages = Math.ceil(totalCount / pageSize);
                }

                // Fetch one extra row beyond pageSize to know whether another
                // page exists in the requested direction. The seek/order/fetch
                // clauses are injected directly into the query's own top-level
                // WHERE (see buildActualWIPInnerQuery) rather than wrapping it
                // in another SELECT -- any extra subquery wrapping around this
                // query reliably breaks NetSuite's paged-result fetch.
                let { innerQuery: pagedQuery, baseParams } = buildActualWIPInnerQuery({ cursorId, direction, pageSize }, null, filters);
                let params = baseParams.slice();
                if (cursorId) { params.push(cursorId); }

                let seekResults = runQuery(pagedQuery, 'getActualWIPReport', params);

                let hasMore = seekResults.length > pageSize;
                let pageResults = seekResults.slice(0, pageSize);
                if (direction === 'prev') {
                    // Rows were fetched in descending order to seek backwards;
                    // restore ascending order for display.
                    pageResults.reverse();
                }

                let hasNext = direction === 'next' ? hasMore : true;
                let hasPrev = direction === 'prev' ? hasMore : Boolean(cursorId);

                log.debug('getActualWIPReport - row count', pageResults.length);
                
                let mappedResults = pageResults.map((row) => ({
                    bagGenerationId: row.bag_generation_id,
                    location: row.location,
                    presentDepartment: row.present_department,
                    bagNumber: row.bag_name,
                    componentItems: row.component_item,
                    stoneQualityGroup: row.stone_quality_group,
                    manufacturer: row.manufacturer,
                    poNumber: row.po_number,
                    salesOrderNo: row.so_tranid,
                    workorder: row.wo_tranid,
                    salesExecutive: row.sales_executive,
                    orderDate: row.order_date,
                    woAgeing: row.wo_ageing,
                    lastMoveDays: row.last_move_days,
                    orderRemarks: row.so_memo_1 || row.so_memo_2,
                    overDueDays: row.overdue_days,
                    orderType: row.order_type,
                    stockType: row.stock_type,
                    orderedQuantity: row.ordered_quantity,
                    bagGenerationDate: row.bag_generation_date,
                    noOfBags: row.no_of_bags,
                    quantityPerBag: row.quantity_per_bag,
                    customerName: row.customer_name || row.companyname,
                    deliveryDate: row.delivery_date,
                    design: row.design,
                    category: row.category,
                    categoryCode: row.category_code,
                    subCategory: row.sub_category,
                    productionDelays: row.production_delay,
                    issueDate: row.created,
                    ringSize: row.ring_size,
                    metalStoneQuality: row.metal_stone_quality,
                    metalStoneColor: row.metal_stone_color,
                    partyDiamondWeight: row.party_diamond_weight,
                    actualDiamondWeightCt: row.actual_diamond_weight_ct,
                    lotMetalIssueDays: row.lot_metal_issue_days,
                    expectedDiamondPieces: row.expected_diamond_pieces,
                    expectedGrossWeight: row.expected_gross_weight,
                    expectedComponentWeight: row.expected_component_weight,
                    expectedMetalPureWeight: row.expected_metal_pure_weight,
                    expectedNetWeightNew: row.expected_net_weight,
                    actualMetalPureWeight: row.actual_metal_pure_weight,
                }));

                return {
                    data: mappedResults,
                    pageSize: pageSize,
                    hasNext: hasNext,
                    hasPrev: hasPrev,
                    firstId: mappedResults.length ? mappedResults[0].bagGenerationId : null,
                    lastId: mappedResults.length ? mappedResults[mappedResults.length - 1].bagGenerationId : null,
                    totalCount: totalCount,
                    totalPages: totalPages,
                };
            } catch (error) {
                log.error('Error @ getActualWIPReport', error);
                return { data: [], pageSize: pageSize, hasNext: false, hasPrev: false, firstId: null, lastId: null, totalCount: null, totalPages: null };
            }
        };

        /**
         * Department-level summary of the Actual WIP Report.
         *
         * Returns ONE row per (present department + location), with all the
         * quantity/weight columns SUMmed across every detail row belonging to
         * that department, and every text/day-count column left blank. This is
         * what the frontend shows on initial page load -- a compact summary of
         * ~10-50 rows instead of tens of thousands of detail rows -- and each
         * summary row can then be expanded on demand via
         * getActualWIPDepartmentDetail (a separate, filtered detail call).
         *
         * IMPLEMENTATION NOTE ON QUERY SAFETY:
         * This does NOT wrap the detail query in an outer SELECT. Both
         * runSuiteQLPaged and runSuiteQL throw UNEXPECTED_ERROR when this
         * deeply-nested join query is wrapped as a subquery (confirmed at
         * runtime). Instead the aggregation is done IN PLACE: the detail
         * SELECT's column list is replaced with SUM()/COUNT() aggregate
         * expressions (via buildActualWIPInnerQuery's selectOverride) and a
         * GROUP BY is appended to that same query's own top-level clause (via
         * the seek.groupByClause hook). This keeps the exact query shape the
         * report already runs successfully, only turning per-row columns into
         * per-department aggregates. No FETCH, no seek, no subquery wrap.
         *
         * It is still executed via runQueryUnpaged (query.runSuiteQL, not
         * runSuiteQLPaged) -- paged fetch throws UNEXPECTED_ERROR while
         * fetching page 0 of this join once GROUP BY is added (confirmed at
         * runtime), even without a subquery wrap; paged fetch appears to
         * depend on per-row cursoring that an aggregated result set doesn't
         * have. Plain runSuiteQL executes the identical SQL fine, and the
         * summary result (one row per department) is far too small to need
         * paging.
         *
         * @param {{location?: string, department?: string, dateFrom?: string,
         *   dateTo?: string, salesOrderNo?: string, workOrderNo?: string,
         *   bagNumber?: string}} [filters] - same optional filters as the
         *   detail report; applied inside the inner query before aggregation.
         * @returns {{data: Array<Object>}}
         */
        const getActualWIPSummary = (filters) => {
            try {
                filters = filters || {};

                // IMPORTANT: aggregate INSIDE the same single query the detail
                // report uses -- do NOT wrap it in an outer SELECT. Both
                // runSuiteQLPaged AND runSuiteQL throw UNEXPECTED_ERROR when
                // this deeply-nested join query is wrapped in a subquery. So
                // instead of `SELECT ... FROM (innerQuery) GROUP BY ...`, we
                // replace the inner SELECT column list with aggregate
                // expressions (selectOverride) and append a GROUP BY to the
                // inner query's own top-level clause (groupByClause). This is
                // the exact query shape that already works for the report,
                // just with SUM()/GROUP BY instead of per-row columns.
                //
                // The aggregate expressions are the SAME raw table expressions
                // used per-row in the detail SELECT (see buildActualWIPInnerQuery)
                // -- they must reference raw columns, not the per-row aliases,
                // because there is no subquery to expose those aliases.
                let deptExpr = "BUILTIN.DF(CUSTOMRECORD_JJ_BAG_GENERATION.custrecord_jj_baggen_present_dept)";
                let locExpr = "BUILTIN.DF(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_location)";

                let aggregateSelect = `
                      BUILTIN_RESULT.TYPE_STRING(${deptExpr}) AS present_department,
                      BUILTIN_RESULT.TYPE_STRING(${locExpr}) AS location,
                      BUILTIN_RESULT.TYPE_INTEGER(COUNT(*)) AS detail_count,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' AND BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_group_0) = 'PARTY DIAMOND QUALITY' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END)) AS party_diamond_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END)) AS actual_diamond_weight_ct,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.created_0))) AS lot_metal_issue_days,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 = 6 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_actual_pieces_info END, 0))) AS expected_diamond_pieces,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(
                        NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)
                        + NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 = 6 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)
                        + NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 = 7 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)
                      )) AS expected_gross_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(
                        CASE
                          WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty
                          WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 IN (6, 7) AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty
                          ELSE 0
                        END
                      )) AS expected_component_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.75 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0))) AS expected_metal_pure_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0))) AS expected_net_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(SUM(
                        ((CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END)
                        * TO_NUMBER(NVL(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_metal_purity_percent_0, '0'))) / 100
                      )) AS actual_metal_pure_weight
                `;

                let groupByClause = `GROUP BY ${deptExpr}, ${locExpr} ORDER BY ${locExpr}, ${deptExpr}`;

                let { innerQuery, baseParams } = buildActualWIPInnerQuery(
                    { groupByClause }, aggregateSelect, filters
                );

                let results = runQueryUnpaged(innerQuery, 'getActualWIPSummary', baseParams);

                // ordered_quantity is TYPE_STRING in the inner SELECT (it is a
                // free-text field on the source record), so SUM() coerces it;
                // NVL guards nulls. Round the float sums to a sane precision so
                // the summary doesn't show 15-digit floating point noise.
                let round = (v) => {
                    let n = Number(v);
                    if (!isFinite(n)) { return 0; }
                    return Math.round(n * 1000) / 1000;
                };

                let mappedResults = results.map((row) => ({
                    location: row.location,
                    presentDepartment: row.present_department,
                    detailCount: Number(row.detail_count) || 0,
                    orderedQuantity: round(row.ordered_quantity),
                    noOfBags: round(row.no_of_bags),
                    quantityPerBag: round(row.quantity_per_bag),
                    partyDiamondWeight: round(row.party_diamond_weight),
                    actualDiamondWeightCt: round(row.actual_diamond_weight_ct),
                    expectedDiamondPieces: round(row.expected_diamond_pieces),
                    expectedGrossWeight: round(row.expected_gross_weight),
                    expectedComponentWeight: round(row.expected_component_weight),
                    expectedMetalPureWeight: round(row.expected_metal_pure_weight),
                    expectedNetWeightNew: round(row.expected_net_weight),
                    actualMetalPureWeight: round(row.actual_metal_pure_weight),
                }));

                return { data: mappedResults };
            } catch (error) {
                log.error('Error @ getActualWIPSummary', error);
                return { data: [] };
            }
        };

        /**
         * Full detail rows for a single department (used when the user expands
         * one department summary row). Reuses the exact same detail query as
         * getActualWIPReport, but forces the `department` filter to the given
         * department name so only that department's rows come back. Location is
         * also passed through (a department name can, in principle, exist under
         * more than one location) to keep the expansion scoped to the summary
         * row that was clicked.
         *
         * This is intentionally a separate on-demand call: expanding every
         * department at once would pull the entire dataset into the page and
         * risk crashing the browser, which is exactly what the summary+expand
         * design avoids.
         *
         * @param {string} department - present department display name to expand.
         * @param {{location?: string, dateFrom?: string, dateTo?: string,
         *   salesOrderNo?: string, workOrderNo?: string, bagNumber?: string}}
         *   [filters] - the other active report filters (department is
         *   overridden with the expanded department).
         * @returns {{data: Array<Object>}}
         */
        const getActualWIPDepartmentDetail = (department, filters) => {
            try {
                filters = filters || {};
                // Force the department filter to the expanded department, keep
                // every other active filter as-is.
                let scopedFilters = {
                    location: filters.location,
                    department: department,
                    dateFrom: filters.dateFrom,
                    dateTo: filters.dateTo,
                    salesOrderNo: filters.salesOrderNo,
                    workOrderNo: filters.workOrderNo,
                    bagNumber: filters.bagNumber,
                };

                // No seek/fetch: return all detail rows for this one
                // department. A single department's row count is a small
                // fraction of the whole report, so it is safe to return
                // unpaged.
                let { innerQuery, baseParams } = buildActualWIPInnerQuery(
                    { orderOnly: true }, null, scopedFilters
                );

                let results = runQuery(innerQuery, 'getActualWIPDepartmentDetail', baseParams);

                let mappedResults = results.map((row) => ({
                    bagGenerationId: row.bag_generation_id,
                    location: row.location,
                    presentDepartment: row.present_department,
                    bagNumber: row.bag_name,
                    componentItems: row.component_item,
                    stoneQualityGroup: row.stone_quality_group,
                    manufacturer: row.manufacturer,
                    poNumber: row.po_number,
                    salesOrderNo: row.so_tranid,
                    workorder: row.wo_tranid,
                    salesExecutive: row.sales_executive,
                    orderDate: row.order_date,
                    woAgeing: row.wo_ageing,
                    lastMoveDays: row.last_move_days,
                    orderRemarks: row.so_memo_1 || row.so_memo_2,
                    overDueDays: row.overdue_days,
                    orderType: row.order_type,
                    stockType: row.stock_type,
                    orderedQuantity: row.ordered_quantity,
                    bagGenerationDate: row.bag_generation_date,
                    noOfBags: row.no_of_bags,
                    quantityPerBag: row.quantity_per_bag,
                    customerName: row.customer_name || row.companyname,
                    deliveryDate: row.delivery_date,
                    design: row.design,
                    category: row.category,
                    categoryCode: row.category_code,
                    subCategory: row.sub_category,
                    productionDelays: row.production_delay,
                    issueDate: row.created,
                    ringSize: row.ring_size,
                    metalStoneQuality: row.metal_stone_quality,
                    metalStoneColor: row.metal_stone_color,
                    partyDiamondWeight: row.party_diamond_weight,
                    actualDiamondWeightCt: row.actual_diamond_weight_ct,
                    lotMetalIssueDays: row.lot_metal_issue_days,
                    expectedDiamondPieces: row.expected_diamond_pieces,
                    expectedGrossWeight: row.expected_gross_weight,
                    expectedComponentWeight: row.expected_component_weight,
                    expectedMetalPureWeight: row.expected_metal_pure_weight,
                    expectedNetWeightNew: row.expected_net_weight,
                    actualMetalPureWeight: row.actual_metal_pure_weight,
                }));

                return { data: mappedResults };
            } catch (error) {
                log.error('Error @ getActualWIPDepartmentDetail', error);
                return { data: [] };
            }
        };

/**
         * Active manufacturing departments joined to their active location,
         * sourced from CUSTOMRECORD_JJ_MANUFACTURING_DEPT (equivalent to the
         * saved search: type customrecord_jj_manufacturing_dept, filtered to
         * isinactive = F on both the department and its joined
         * CUSTRECORD_JJ_MANDEPT_LOCATION, columns internalid/name on both).
         * Powers the Location and Department filter dropdowns: the Location
         * dropdown lists every distinct joined location, and the Department
         * dropdown can be narrowed to only the departments under whichever
         * location the user picked first.
         * @returns {Array<{departmentId: number, departmentName: string,
         *   locationId: number|null, locationName: string|null}>}
         */
        const getManufacturingDepartments = () => {
            try {
                let query = `
                    SELECT
                      CUSTOMRECORD_JJ_MANUFACTURING_DEPT.ID AS department_id,
                      CUSTOMRECORD_JJ_MANUFACTURING_DEPT.name AS department_name,
                      Location.ID AS location_id,
                      Location.name AS location_name
                    FROM
                      CUSTOMRECORD_JJ_MANUFACTURING_DEPT
                    LEFT JOIN
                      Location
                    ON
                      CUSTOMRECORD_JJ_MANUFACTURING_DEPT.custrecord_jj_mandept_location = Location.ID
                    WHERE
                      NVL(CUSTOMRECORD_JJ_MANUFACTURING_DEPT.isinactive, 'F') = ?
                      AND (Location.ID IS NULL OR NVL(Location.isinactive, 'F') = ?)
                `;
                let results = runQuery(query, 'getManufacturingDepartments', ['F', 'F']);
                return results.map((row) => ({
                    departmentId: row.department_id,
                    departmentName: row.department_name,
                    locationId: row.location_id,
                    locationName: row.location_name,
                }));
            } catch (error) {
                log.error('Error @ getManufacturingDepartments', error);
                return [];
            }
        };

        /**
         * Active Locations, Classifications, and Bins -- sourced directly
         * from their own NetSuite records (not derived from whatever rows
         * happen to be in a Stock with Date result set), so the Stock with
         * Date report's Location/Class/Bin Number filter dropdowns always
         * offer every valid option regardless of what the current filters
         * have narrowed the table down to.
         * @returns {{locations: Array<{id: number, name: string}>,
         *   classes: Array<{id: number, name: string}>,
         *   bins: Array<{id: number, name: string}>}}
         */
        const getStockFilterOptions = () => {
            const locations = runQuery(
                `SELECT ID AS id, name FROM Location WHERE NVL(isinactive, 'F') = ? ORDER BY name`,
                'getStockFilterOptions.locations', ['F']
            );
            const classes = runQuery(
                `SELECT ID AS id, name FROM Classification WHERE NVL(isinactive, 'F') = ? ORDER BY name`,
                'getStockFilterOptions.classes', ['F']
            );
            const bins = runQuery(
                `SELECT ID AS id, binnumber AS name FROM Bin WHERE NVL(isinactive, 'F') = ? ORDER BY binnumber`,
                'getStockFilterOptions.bins', ['F']
            );
            return {
                locations: locations.map((row) => ({ id: row.id, name: row.name })),
                classes: classes.map((row) => ({ id: row.id, name: row.name })),
                bins: bins.map((row) => ({ id: row.id, name: row.name })),
            };
        };

        /**
         * Shared filter expression for the Stock with Date report -- the base
         * "is this transaction row part of the netted stock movement set"
         * condition, plus whichever of location/class/binNumber/dateTo the
         * caller supplied. Shared between the summary (grouped by location
         * only) and detail (one location, full breakdown) queries so the two
         * searches can never drift out of sync on what counts as "in scope".
         * @param {{location?: string, class?: string, binNumber?: string,
         *   dateTo?: string}} filters - dateTo is a 'DD-Mon-YYYY hh:mm AM/PM'
         *   string at midnight of the selected date itself, used as an
         *   exclusive upper bound (matches strictly before that midnight).
         *   There is no dateFrom -- the report always shows from the first
         *   record up to dateTo.
         * @returns {Array} N/search filter expression
         */
        const buildStockFilters = (filters) => {
            let stockFilters = [
                ['formulanumeric: case when {item.inventorylocation.id} = {location.id} then 1 end', 'equalto', '1'],
                'AND',
                [[[['accounttype', 'anyof', 'OthCurrAsset', 'OthCurrLiab'], 'OR', ['type', 'anyof', 'ItemShip'], 'OR', [['type', 'anyof', 'CustInvc', 'CashSale'], 'AND', ['createdfrom', 'anyof', '@NONE@']], 'OR', [['type', 'anyof', 'CustCred', 'CashRfnd'], 'AND', [['createdfrom', 'anyof', '@NONE@'], 'OR', ['createdfrom.type', 'anyof', 'CustInvc', 'CashSale']]]], 'AND', ['posting', 'is', 'T'], 'AND', ['inventorydetail.inventorynumber', 'noneof', '@NONE@']], 'OR', ['type', 'anyof', 'BinTrnfr']],
                'AND',
                // Dropped a formula filter here that compared
                // inventorydetail.inventorynumber to itemnumber.inventorynumber
                // but returned 1 in BOTH branches (THEN 1 ELSE 1) -- it could
                // never filter anything out, yet NetSuite still joined and
                // evaluated it per row on every request. Pure wasted cost.
                ['formulanumeric: CASE WHEN {inventorydetail.inventorynumber} = {serialnumber} THEN 1 ELSE 0 END', 'equalto', '1'],
                'AND',
                ['item.type', 'anyof', 'Assembly', 'InvtPart'],
                'AND',
                ["sum(formulanumeric: CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END)", 'notequalto', '0'],
            ];

            // location/class/binNumber are List/Record fields -- 'anyof'
            // matches on internal ID, so the frontend must send the IDs
            // returned alongside their display names, not the display text.
            // IMPORTANT: filter on the plain 'location' field, NOT
            // 'locationnohierarchy' -- *nohierarchy fields are column-display
            // variants (leaf name without the parent-path prefix) and don't
            // reliably filter by 'anyof' internal ID; using it here made
            // getStockLocationDetail's location filter silently match zero
            // rows for every location. 'locationnohierarchy' is still used
            // for the DISPLAY column elsewhere in these searches -- that's
            // an unaffected, purely cosmetic use.
            if (filters.location) {
                stockFilters.push('AND', ['location', 'anyof', filters.location]);
            }
            // Same *nohierarchy pitfall as location above: item.classnohierarchy
            // is the display-column variant and doesn't reliably filter by
            // 'anyof' internal ID -- filter on the plain item.class field
            // instead. classnohierarchy stays in use for the DISPLAY column
            // elsewhere in these searches, which is unaffected.
            if (filters.class) {
                stockFilters.push('AND', ['item.class', 'anyof', filters.class]);
            }
            if (filters.binNumber) {
                stockFilters.push('AND', ['inventorydetail.binnumber', 'anyof', filters.binNumber]);
            }
            // dateTo is a 'DD-Mon-YYYY hh:mm AM/PM' string at midnight of the
            // SELECTED date itself (e.g. picking the 10th sends "10th 12:00
            // AM"), so 'before' shows everything strictly before that
            // midnight -- i.e. up through the 9th, excluding the 10th. There
            // is no dateFrom: the report always shows from the first record
            // up to dateTo.
            if (filters.dateTo) {
                stockFilters.push('AND', ['datecreated', 'before', filters.dateTo]);
            }
            return stockFilters;
        };

        // The 5 material-weight/stock-effect SUM formula columns, shared
        // verbatim between the summary and detail searches. Kept as a
        // factory (not a constant array) because N/search column objects
        // are consumed/positioned by the specific search that creates them.
        const buildStockWeightColumns = () => ([
            search.createColumn({
                name: 'formulanumeric', summary: 'SUM',
                formula: "CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END",
                label: 'JJ Stock Effect Quantity',
            }),
            search.createColumn({
                name: 'formulanumeric', summary: 'SUM',
                formula: "CASE WHEN {item.classnohierarchy} IN ('Gold Back Chain', 'Gold Bullion', 'Gold Findings', 'Gold Mountings') THEN ((CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END) * ({item.custitem_jj_metal_purity_percent}/100)) ELSE 0 END",
                label: 'Gold Item Pure Weight',
            }),
            search.createColumn({
                name: 'formulanumeric', summary: 'SUM',
                formula: "TO_NUMBER(CASE WHEN {item.classnohierarchy} IN ('Diamond') THEN NVL((CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END),0) ELSE 0 END)",
                label: 'Diamond Item Weight',
            }),
            search.createColumn({
                name: 'formulanumeric', summary: 'SUM',
                formula: "CASE WHEN {item.classnohierarchy} IN ('Colour Stone') THEN (CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END) ELSE 0 END",
                label: 'Colorstone Item Weight',
            }),
            search.createColumn({
                name: 'formulanumeric', summary: 'SUM',
                formula: "CASE WHEN {item.classnohierarchy} = 'Alloy' THEN (CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END) ELSE (CASE WHEN {item.classnohierarchy} IN ('Gold Back Chain', 'Gold Bullion', 'Gold Findings', 'Gold Mountings') THEN (CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END) - ((CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END) * ({item.custitem_jj_metal_purity_percent}/100)) ELSE 0 END) END",
                label: 'Alloy Item Weight',
            }),
            search.createColumn({
                name: 'formulanumeric', summary: 'SUM',
                formula: "CASE WHEN {item.classnohierarchy} IN ('Consumables') THEN (CASE WHEN {type} = 'Bin Transfer' THEN CASE WHEN NVL({quantity},0) > 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END WHEN {type} IN ('Item Fulfillment', 'Invoice', 'Cash Sale') THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) WHEN {type} IN ('Credit Memo', 'Cash Refund') THEN ABS(NVL({inventorydetail.quantity},{quantity})) ELSE CASE WHEN NVL({quantity},0) < 0 THEN -1 * ABS(NVL({inventorydetail.quantity},{quantity})) ELSE ABS(NVL({inventorydetail.quantity},{quantity})) END END) ELSE 0 END",
                label: 'Consumable Item Weight',
            }),
        ]);

        /**
         * Stock with Date report -- LOCATION-LEVEL SUMMARY. Grouped by
         * location only (no Class/Item/Inventory Number/Bin Number in the
         * GROUP BY), so NetSuite aggregates far fewer distinct groups per
         * page than the old flat per-inventory-number query -- this is what
         * the initial page load now calls. Full per-item/inventory-number
         * breakdown for one location is fetched separately, on demand, by
         * getStockLocationDetail (called only when that location is expanded).
         * @param {{location?: string, class?: string, binNumber?: string,
         *   dateTo?: string}} [filters]
         * @param {{pageIndex?: number, pageSize?: number}} [paging]
         * @returns {{data: Array<Object>, pageIndex: number, pageSize: number,
         *   totalResults: number, pageCount: number, hasNext: boolean,
         *   hasPrev: boolean}}
         */
        const getStockSummary = (filters, paging) => {
            filters = filters || {};
            paging = paging || {};
            let pageSize = Math.min(Number(paging.pageSize) || 1000, 1000);
            let pageIndex = Math.max(Number(paging.pageIndex) || 0, 0);
            try {
                // NOTE: this search groups by location only, so NetSuite's
                // SUM on join-sourced columns (inventorydetail.quantity and
                // every weight formula derived from it) can differ slightly
                // from the sum of that same location's own detail rows once
                // expanded (getStockLocationDetail groups more finely, by
                // Class/Item/Inventory Number/Bin Number too -- NetSuite's
                // join fan-out for those SUMs depends on the GROUP BY
                // columns present). Computing an always-consistent total
                // would mean running the full detail-grouped search for
                // every location on the page before showing anything, which
                // is slow -- so this trades perfect total/detail agreement
                // for a fast page load.
                log.debug('getStockSummary - Building filters with:', { filters });
                const filterExpression = buildStockFilters(filters);
                log.debug('getStockSummary - Filter expression:', { filterExpression });
                
                let stockSearch = search.create({
                    type: 'transaction',
                    settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
                    filters: filterExpression,
                    columns: [
                        search.createColumn({ name: 'locationnohierarchy', summary: 'GROUP', label: 'Location' }),
                        // Separate plain 'location' column purely for a
                        // reliable internal ID -- locationnohierarchy's
                        // getValue() is a column-display variant and isn't
                        // guaranteed to return the filterable location ID
                        // (see buildStockFilters' 'location' vs
                        // 'locationnohierarchy' filter note above).
                        search.createColumn({ name: 'location', summary: 'GROUP', label: 'Location ID' }),
                        search.createColumn({ name: 'quantity', summary: 'SUM', label: 'Quantity' }),
                        search.createColumn({ name: 'quantity', join: 'inventoryDetail', summary: 'SUM', label: 'Inventory Detail Quantity' }),
                        ...buildStockWeightColumns(),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_cs_weight},0))', label: 'Serial Color Stone Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_alloy_weight},0))', label: 'Serial Alloy Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_diamond_weight},0))', label: 'Serial Diamond Weight (gm)' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL(({itemnumber.custitemnumber_jj_serial_num_diamond_weight}*5),0))', label: 'Serial Diamond Weight(CTS)' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'NVL({itemnumber.custitemnumber_jj_serial_num_diamond_pieces},0)', label: 'Serial Diamond Pieces' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_gross_weight},0))', label: 'Serial Gross Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_pure_weight},0))', label: 'Serial Pure Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_net_weight},0))', label: 'Serial Net Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_cost_making_charge},0))', label: 'Making Charge' }),
                    ],
                });

                log.debug('getStockSummary - Search created, running paged query');
                let pagedData = stockSearch.runPaged({ pageSize: pageSize });
                let totalResults = pagedData.count;
                let pageCount = pagedData.pageRanges.length;
                pageIndex = Math.min(pageIndex, Math.max(pageCount - 1, 0));
                let results = pageCount > 0 ? pagedData.fetch({ index: pageIndex }).data : [];

                let cols = stockSearch.columns;
                let data = results.map((result) => ({
                    location: result.getText(cols[0]) || result.getValue(cols[0]),
                    locationId: result.getValue(cols[1]),
                    quantity: result.getValue(cols[2]),
                    inventoryDetailQuantity: result.getValue(cols[3]),
                    stockEffectQuantity: result.getValue(cols[4]),
                    goldItemPureWeight: result.getValue(cols[5]),
                    diamondItemWeight: result.getValue(cols[6]),
                    colorstoneItemWeight: result.getValue(cols[7]),
                    alloyItemWeight: result.getValue(cols[8]),
                    consumableItemWeight: result.getValue(cols[9]),
                    serialColorStoneWeight: result.getValue(cols[10]),
                    serialAlloyWeight: result.getValue(cols[11]),
                    serialDiamondWeightGm: result.getValue(cols[12]),
                    serialDiamondWeightCts: result.getValue(cols[13]),
                    serialDiamondPieces: result.getValue(cols[14]),
                    serialGrossWeight: result.getValue(cols[15]),
                    serialPureWeight: result.getValue(cols[16]),
                    serialNetWeight: result.getValue(cols[17]),
                    makingCharge: result.getValue(cols[18]),
                }));

                return {
                    data: data,
                    pageIndex: pageIndex,
                    pageSize: pageSize,
                    totalResults: totalResults,
                    pageCount: pageCount,
                    hasNext: pageIndex < pageCount - 1,
                    hasPrev: pageIndex > 0,
                };
            } catch (error) {
                log.error('Error @ getStockSummary', error);
                log.error('getStockSummary - Error details:', {
                    errorMessage: error.message,
                    errorCode: error.code,
                    errorName: error.name,
                    errorStack: error.stack,
                });
                return { data: [], pageIndex: 0, pageSize: pageSize, totalResults: 0, pageCount: 0, hasNext: false, hasPrev: false };
            }
        };

        /**
         * Stock with Date report -- FULL DETAIL for a single location (used
         * when the user expands one location's summary row). Same
         * Class/Item/Inventory Number/Bin Number breakdown the old
         * getStockWithDateSearch always returned for every location on every
         * page -- now fetched only for the one location actually expanded,
         * on demand, exactly like getActualWIPDepartmentDetail.
         * @param {string} location - internal ID of the location to expand
         *   (same ID space as the locationnohierarchy filter/column).
         * @param {{class?: string, binNumber?: string,
         *   dateTo?: string}} [filters] - the other active report filters
         *   (any location in here is overridden with the expanded location).
         * @param {{pageIndex?: number, pageSize?: number}} [paging] - a
         *   single busy location can itself hold thousands of Class/Item/
         *   Inventory Number/Bin Number rows -- same execution-time concern
         *   as the summary search, so this is paged the same way (one page
         *   fetched per call; pageIndex defaults to 0, pageSize defaults to
         *   1000).
         * @returns {{data: Array<Object>, pageIndex: number, pageSize: number,
         *   totalResults: number, pageCount: number, hasNext: boolean,
         *   hasPrev: boolean}}
         */
        const getStockLocationDetail = (location, filters, paging) => {
            paging = paging || {};
            let pageSize = Math.min(Number(paging.pageSize) || 1000, 1000);
            let pageIndex = Math.max(Number(paging.pageIndex) || 0, 0);
            try {
                filters = filters || {};
                let detailFilters = Object.assign({}, filters, { location: location });

                let stockSearch = search.create({
                    type: 'transaction',
                    settings: [{ name: 'consolidationtype', value: 'ACCTTYPE' }],
                    filters: buildStockFilters(detailFilters),
                    columns: [
                        search.createColumn({ name: 'class', join: 'item', summary: 'GROUP', label: 'Class' }),
                        search.createColumn({ name: 'item', summary: 'GROUP', label: 'Item' }),
                        search.createColumn({ name: 'locationnohierarchy', summary: 'GROUP', label: 'Location' }),
                        search.createColumn({ name: 'quantity', summary: 'SUM', label: 'Quantity' }),
                        search.createColumn({ name: 'inventorynumber', join: 'inventoryDetail', summary: 'GROUP', label: 'Inventory Number' }),
                        search.createColumn({ name: 'binnumber', join: 'inventoryDetail', summary: 'GROUP', label: 'Bin Number' }),
                        search.createColumn({ name: 'quantity', join: 'inventoryDetail', summary: 'SUM', label: 'Inventory Detail Quantity' }),
                        ...buildStockWeightColumns(),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_cs_weight},0))', label: 'Serial Color Stone Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_alloy_weight},0))', label: 'Serial Alloy Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_diamond_weight},0))', label: 'Serial Diamond Weight (gm)' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL(({itemnumber.custitemnumber_jj_serial_num_diamond_weight}*5),0))', label: 'Serial Diamond Weight(CTS)' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'NVL({itemnumber.custitemnumber_jj_serial_num_diamond_pieces},0)', label: 'Serial Diamond Pieces' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_gross_weight},0))', label: 'Serial Gross Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_pure_weight},0))', label: 'Serial Pure Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_serial_num_net_weight},0))', label: 'Serial Net Weight' }),
                        search.createColumn({ name: 'formulanumeric', summary: 'SUM', formula: 'MAX(NVL({itemnumber.custitemnumber_jj_cost_making_charge},0))', label: 'Making Charge' }),
                        search.createColumn({ name: 'custitemnumber_jj_fg_metal_quality', join: 'itemNumber', summary: 'GROUP', label: 'Serial Metal Quality' }),
                        search.createColumn({ name: 'custitemnumber_jj_fg_metal_purity', join: 'itemNumber', summary: 'GROUP', label: 'Serial Metal Purity' }),
                        search.createColumn({ name: 'custitemnumber_jj_fg_metal_colour', join: 'itemNumber', summary: 'GROUP', label: 'Serial Metal Colour' }),
                        search.createColumn({ name: 'custitemnumber_jj_fg_stone_quality', join: 'itemNumber', summary: 'GROUP', label: 'Serial Stone Quality' }),
                        search.createColumn({ name: 'custitemnumber_jj_fg_stone_color', join: 'itemNumber', summary: 'GROUP', label: 'Serial Stone Colour' }),
                        search.createColumn({ name: 'custitem_jj_subcategory_type', join: 'item', summary: 'GROUP', label: 'Subcategory Type' }),
                        // MAX (not GROUP) so this doesn't fragment the
                        // Class/Item/Inventory Number/Bin Number grouping
                        // into more rows -- a detail row's underlying
                        // transactions are already scoped to the same
                        // dateTo filter, so any one of their creation dates
                        // within that range is representative.
                        search.createColumn({ name: 'datecreated', summary: 'MAX', label: 'Date Created' }),
                    ],
                });

                // Only ONE page is ever fetched per call -- see getStockSummary
                // for why (a single location's own detail can still run into
                // the thousands of rows).
                let pagedData = stockSearch.runPaged({ pageSize: pageSize });
                let totalResults = pagedData.count;
                let pageCount = pagedData.pageRanges.length;
                pageIndex = Math.min(pageIndex, Math.max(pageCount - 1, 0));
                let results = pageCount > 0 ? pagedData.fetch({ index: pageIndex }).data : [];

                // Several columns share name:'formulanumeric'/summary:'SUM' with
                // different formulas, so they must be addressed by their column
                // OBJECT (stockSearch.columns[i]), not by a {name, summary}
                // criteria object -- that criteria form can't disambiguate
                // between duplicate formula columns.
                let cols = stockSearch.columns;
                let data = results.map((result) => ({
                    class: result.getText(cols[0]) || result.getValue(cols[0]),
                    classId: result.getValue(cols[0]),
                    item: result.getText(cols[1]) || result.getValue(cols[1]),
                    location: result.getText(cols[2]) || result.getValue(cols[2]),
                    locationId: result.getValue(cols[2]),
                    quantity: result.getValue(cols[3]),
                    inventoryNumber: result.getText(cols[4]) || result.getValue(cols[4]),
                    binNumber: result.getText(cols[5]) || result.getValue(cols[5]),
                    binNumberId: result.getValue(cols[5]),
                    inventoryDetailQuantity: result.getValue(cols[6]),
                    stockEffectQuantity: result.getValue(cols[7]),
                    goldItemPureWeight: result.getValue(cols[8]),
                    diamondItemWeight: result.getValue(cols[9]),
                    colorstoneItemWeight: result.getValue(cols[10]),
                    alloyItemWeight: result.getValue(cols[11]),
                    consumableItemWeight: result.getValue(cols[12]),
                    serialColorStoneWeight: result.getValue(cols[13]),
                    serialAlloyWeight: result.getValue(cols[14]),
                    serialDiamondWeightGm: result.getValue(cols[15]),
                    serialDiamondWeightCts: result.getValue(cols[16]),
                    serialDiamondPieces: result.getValue(cols[17]),
                    serialGrossWeight: result.getValue(cols[18]),
                    serialPureWeight: result.getValue(cols[19]),
                    serialNetWeight: result.getValue(cols[20]),
                    makingCharge: result.getValue(cols[21]),
                    serialMetalQuality: result.getText(cols[22]) || result.getValue(cols[22]),
                    serialMetalPurity: result.getText(cols[23]) || result.getValue(cols[23]),
                    serialMetalColour: result.getText(cols[24]) || result.getValue(cols[24]),
                    serialStoneQuality: result.getText(cols[25]) || result.getValue(cols[25]),
                    serialStoneColour: result.getText(cols[26]) || result.getValue(cols[26]),
                    subcategoryType: result.getText(cols[27]) || result.getValue(cols[27]),
                    dateCreated: result.getText(cols[28]) || result.getValue(cols[28]),
                }));

                return {
                    data: data,
                    pageIndex: pageIndex,
                    pageSize: pageSize,
                    totalResults: totalResults,
                    pageCount: pageCount,
                    hasNext: pageIndex < pageCount - 1,
                    hasPrev: pageIndex > 0,
                };
            } catch (error) {
                log.error('Error @ getStockLocationDetail', error);
                return { data: [], pageIndex: 0, pageSize: pageSize, totalResults: 0, pageCount: 0, hasNext: false, hasPrev: false };
            }
        };

        const wipModel = { getActualWIPReport, getActualWIPSummary, getActualWIPDepartmentDetail, getManufacturingDepartments, getStockSummary, getStockLocationDetail, getStockFilterOptions };
        jjUtil.applyTryCatch(wipModel, 'JJ CM WIP Saved Searches');

        return wipModel;
    });
