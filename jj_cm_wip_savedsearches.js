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
 * Model layer for the WIP (Work In Progress) Reports. Contains data-access
 * functions that query NetSuite (via SuiteQL) for the Actual WIP Report,
 * returning plain arrays of row objects to the Suitelet.

REVISION HISTORY
* @version 1.0 DEWIN-400: 15-July-2026: Created the initial build


* COPYRIGHT © 2026 Jobin & Jismi.
* All rights reserved. This script is a proprietary product of Jobin & Jismi IT Services LLP and is protected by copyright
* law and international treaties. Unauthorized reproduction or distribution of this script, or any portion of it,
* may result in severe civil and criminal penalties and will be prosecuted to the maximum extent possible under law.
************************************************************************************************************************/
define(['N/query', '../Libraries/jj_cm_wip_utility.js'],
    /**
     * @param{query} query
     * @param{jjUtil} jjUtil
     */
    (query, jjUtil) => {

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
         * @returns {{innerQuery: string, baseParams: Array<string>}}
         */
        const buildActualWIPInnerQuery = (seek, selectOverride) => {
            seek = seek || {};
            let seekClause = '';
            if (seek.cursorId) {
                seekClause = seek.direction === 'prev'
                    ? 'AND CUSTOMRECORD_JJ_BAG_GENERATION.ID < ?'
                    : 'AND CUSTOMRECORD_JJ_BAG_GENERATION.ID > ?';
            }
            let orderAndFetchClause = seek.pageSize
                ? `ORDER BY CUSTOMRECORD_JJ_BAG_GENERATION.ID ${seek.direction === 'prev' ? 'DESC' : 'ASC'} FETCH NEXT ${Number(seek.pageSize) + 1} ROWS ONLY`
                : '';
            let selectList = selectOverride || `
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_GENERATION.ID) AS bag_generation_id,
                      BUILTIN_RESULT.TYPE_INTEGER(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.custrecord_jj_bagcore_so) AS custrecord_jj_bagcore_so,
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
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS actual_metal_pure_weight,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_metal_color_0) || BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_color_0)) AS metal_stone_color,
                      BUILTIN_RESULT.TYPE_STRING(BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_metal_quality_0) || BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_0)) AS metal_stone_quality,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS actual_diamond_weight_ct,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' AND BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custitem_jj_stone_quality_group_0) = 'PARTY DIAMOND QUALITY' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS party_diamond_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_entry)) AS last_move_days,
                      BUILTIN_RESULT.TYPE_STRING(CUSTOMRECORD_JJ_BAG_CORE_TRACKING_SUB.companyname) AS companyname,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_pieces_0 ELSE 0 END) AS expected_diamond_pieces_new,
                      BUILTIN_RESULT.TYPE_FLOAT((NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0) + NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0 = 6 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) + NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0 = 7 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) AS expected_gross_weight_new,
                      BUILTIN_RESULT.TYPE_FLOAT(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_join_0_0 = 6 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END) AS expected_diamond_weight_test,
                      BUILTIN_RESULT.TYPE_FLOAT(TRUNC(CURRENT_DATE) - TRUNC(CUSTOMRECORD_JJ_OPERATIONS_SUB.custrecord_jj_oprtns_entry)) AS lot_metal_issue_days,
                      BUILTIN_RESULT.TYPE_FLOAT((CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Diamond' THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END + CASE WHEN BUILTIN.DF(CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.class_0) = 'Colour Stone' THEN 0.2 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) + CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_quantity_0 ELSE 0 END) AS expected_diamond_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN 0.75 * CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) AS expected_metal_pure_weight,
                      BUILTIN_RESULT.TYPE_FLOAT(NVL(CASE WHEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.id_0_0_1 = 5 AND (CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line = 'F' OR CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_newly_add_line IS NULL) THEN CUSTOMRECORD_JJ_BAGCORE_MATERIALS_SUB.custrecord_jj_bagcoremat_qty END, 0)) AS expected_net_weight_new,
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
                      ${seekClause}
                    ${orderAndFetchClause}
                `;

            return { innerQuery, baseParams: ['F', 'F', 'F', 'F', 'F', 'F', 'T'] };
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
         * @returns {{data: Array<Object>, hasNext: boolean, hasPrev: boolean,
         *            totalCount?: number, totalPages?: number}}
         */
        const getActualWIPReport = (pageSize, cursorId, direction) => {
            try {
                pageSize = Number(pageSize) > 0 ? Number(pageSize) : 20;
                cursorId = cursorId ? Number(cursorId) : null;
                direction = direction === 'prev' ? 'prev' : 'next';

                // Only the very first request (no cursorId, i.e. initial page
                // load) pays for a full COUNT(*) scan to report the total page
                // count. Every subsequent Next/Previous call always carries a
                // cursorId and skips this entirely, so keyset pagination speed
                // is unaffected.
                let totalCount = null;
                let totalPages = null;
                if (!cursorId) {
                    let { innerQuery: countQuery, baseParams: countBaseParams } = buildActualWIPInnerQuery(null, 'COUNT(*) AS total_count');
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
                let { innerQuery: pagedQuery, baseParams } = buildActualWIPInnerQuery({ cursorId, direction, pageSize });
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
                    expectedDiamondPiecesNew: row.expected_diamond_pieces_new,
                    expectedDiamondWeightTest: row.expected_diamond_weight_test,
                    expectedDiamondWeight: row.expected_diamond_weight,
                    expectedGrossWeightNew: row.expected_gross_weight_new,
                    expectedMetalPureWeight: row.expected_metal_pure_weight,
                    expectedNetWeightNew: row.expected_net_weight_new,
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

        const wipModel = { getActualWIPReport };
        jjUtil.applyTryCatch(wipModel, 'JJ CM WIP Saved Searches');

        return wipModel;
    });
