<template>
    <div class="min-h-screen w-full px-4 py-2 bg-gray-50">

        <div class="w-full mx-auto">
            <!-- Header -->
            <div class="flex items-center justify-between mb-2">
                <div class="px-2 py-2">
                    <h1 class="text-2xl font-bold text-gray-800">Actual WIP Report</h1>
                    <p class="text-sm text-gray-500 mt-2">Report to view work-in-progress details</p>
                </div>
                <div class="flex items-center gap-2 relative">
                    <button @click="downloadExcel(null, undefined, null, null, null, true)" :disabled="loading"
                        class="bg-white border border-gray-300 text-gray-600 hover:text-black hover:border-gray-400 rounded-md px-3 py-2 text-sm shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-gray-600 disabled:hover:border-gray-300"
                        :title="loading ? 'Waiting for data to load...' : 'Export'">
                        <i class="fas fa-file-excel mr-2 text-green-600"></i>Export
                    </button>
                </div>
            </div>

            <!-- Filters -->
            <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 mb-4">
                <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Location</label>
                        <SearchableSelect v-model="filters.location" :options="locationOptions"
                            :loading="filterOptionsLoading" placeholder="Search location..." />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Department</label>
                        <SearchableSelect v-model="filters.department" :options="departmentOptions"
                            :loading="filterOptionsLoading" placeholder="Search department..." />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Date From</label>
                        <input v-model="filters.dateFrom" type="date"
                            class="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Date To</label>
                        <input v-model="filters.dateTo" type="date"
                            class="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">SO Number</label>
                        <div class="relative">
                            <input v-model="filters.salesOrderNo" type="text" placeholder="SO Number"
                                class="w-full text-sm border border-gray-300 rounded-md pl-2 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                            <button v-if="filters.salesOrderNo" type="button" @click="filters.salesOrderNo = ''" title="Clear"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                            <button v-else type="button" @click="pasteInto('salesOrderNo')" title="Paste"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-paste text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">WO Number</label>
                        <div class="relative">
                            <input v-model="filters.workOrderNo" type="text" placeholder="WO Number"
                                class="w-full text-sm border border-gray-300 rounded-md pl-2 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                            <button v-if="filters.workOrderNo" type="button" @click="filters.workOrderNo = ''" title="Clear"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                            <button v-else type="button" @click="pasteInto('workOrderNo')" title="Paste"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-paste text-xs"></i>
                            </button>
                        </div>
                    </div>
                    <div>
                        <label class="block text-xs font-medium text-gray-500 mb-1">Bag Number</label>
                        <div class="relative">
                            <input v-model="filters.bagNumber" type="text" placeholder="Bag Number"
                                class="w-full text-sm border border-gray-300 rounded-md pl-2 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-gray-400" />
                            <button v-if="filters.bagNumber" type="button" @click="filters.bagNumber = ''" title="Clear"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-times text-xs"></i>
                            </button>
                            <button v-else type="button" @click="pasteInto('bagNumber')" title="Paste"
                                class="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 px-1">
                                <i class="fas fa-paste text-xs"></i>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="flex items-center justify-end gap-2 mt-3">
                    <button @click="applyFilters" :disabled="!filtersPendingApply"
                        class="bg-gray-700 hover:bg-gray-800 text-white text-sm rounded-md px-3 py-1.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-gray-700"
                        :title="filtersPendingApply ? 'Apply Filters' : 'No filter changes to apply'">
                        <i class="fas fa-filter mr-1"></i>Apply Filters
                    </button>
                    <button @click="clearFilters"
                        class="bg-white border border-gray-300 text-gray-600 hover:text-black hover:border-gray-400 text-sm rounded-md px-3 py-1.5">
                        Clear
                    </button>
                </div>
            </div>

            <!-- Table -->
            <div>
                <!-- Data Table Section -->
                <div class="mb-6">
                    <h2 class="text-sm font-semibold text-gray-800 mb-3 flex items-center justify-between">
                        <span class="flex items-center">
                            <i class="fas fa-table mr-2 text-table-600"></i>WIP Data
                        </span>
                    </h2>
                    <div class="table-main-wrapper relative isolate rounded-lg border border-gray-200 shadow-sm">
                        <div class="table-main bg-white overflow-auto">
                        <table class="w-full whitespace-nowrap">
                            <thead>
                                <tr class="bg-gray-700 text-white text-[12px] uppercase tracking-wide">
                                    <th class="frozen-col frozen-col-1 px-4 py-2 text-left font-medium bg-gray-700">Location</th>
                                    <th class="frozen-col frozen-col-2 px-4 py-2 text-left font-medium bg-gray-700">Present Department</th>
                                    <th class="frozen-col frozen-col-3 px-4 py-2 text-left font-medium bg-gray-700" v-if="showBlankSummaryColumns">Bag Number</th>
                                    <th class="frozen-col frozen-col-4 px-4 py-2 text-left font-medium bg-gray-700" v-if="showBlankSummaryColumns">Component Items</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-3 text-left font-medium bg-gray-700">Stone Quality Group</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Manufacturer</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">PO Number</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Sales Order No</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Work Order No</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Sales Executive</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Order Date</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-right font-medium bg-gray-700">WO Ageing</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-right font-medium bg-gray-700">LAST Move Days</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Order Remarks</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-right font-medium bg-gray-700">OverDue Days</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Order Type</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Stock Type</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-right font-medium bg-gray-700">Ordered Quantity</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Bag Generation Date</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-right font-medium bg-gray-700">No Of Bags</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-right font-medium bg-gray-700">Quantity Per Bag</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Customer Name</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Delivery Date</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Design</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Category</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Category Code</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Sub Category</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Production Delays</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Issue Date</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Ring Size</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Metal/Stone Quality</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-left font-medium bg-gray-700">Metal/Stone Color</th>
                                    <th v-if="showBlankSummaryColumns" class="px-4 py-2 text-right font-medium bg-gray-700">Lot Metal Issue days</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Party Diamond Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Actual Diamond Weight (CT)</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Diamond Pieces</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Gross Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Component Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Metal Pure Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Expected Net Weight</th>
                                    <th class="px-4 py-2 text-right font-medium bg-gray-700">Actual Metal Pure Weight</th>
                                </tr>
                            </thead>
                            <tbody v-if="loading" class="divide-y divide-gray-100">
                                <tr v-for="n in skeletonRowCount" :key="'skeleton-' + n" class="animate-pulse">
                                    <td v-for="c in 40" :key="c" class="px-4 py-3" :class="{ 'frozen-col frozen-col-1 bg-white': c === 1, 'frozen-col frozen-col-2 bg-white': c === 2 }">
                                        <div class="h-3 bg-gray-200 rounded"></div>
                                    </td>
                                </tr>
                            </tbody>
                            <tbody v-else class="divide-y divide-gray-100">
                                <template v-for="(dept, deptIndex) in summaryRows" :key="'dept-' + deptIndex">
                                    <!-- Department summary row -->
                                    <tr class="summary-row" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold bg-gray-100'">
                                        <td class="frozen-col frozen-col-1 px-4 py-2 text-gray-900 font-bold summary-cell">{{ dept.location }}</td>
                                        <td class="frozen-col frozen-col-2 px-2 py-2 text-gray-900 summary-cell">
                                            <div class="flex items-center gap-2">
                                                <button type="button"
                                                    @click="toggleDepartment(deptIndex)"
                                                    class="expand-btn flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border border-gray-400 text-gray-600 hover:bg-gray-700 hover:text-white"
                                                    :title="dept.expanded ? 'Collapse' : 'Expand'">
                                                    <i v-if="dept.loading" class="fas fa-spinner fa-spin text-[10px]"></i>
                                                    <i v-else :class="dept.expanded ? 'fas fa-chevron-down' : 'fas fa-chevron-right'" class="text-[10px]"></i>
                                                </button>
                                                <span class="font-bold">{{ dept.presentDepartment }}</span>
                                                <span class="text-[10px] font-normal text-gray-500">({{ dept.detailCount }})</span>
                                                <span v-if="dept.expanded" class="text-[9px] font-bold uppercase tracking-wide text-gray-800 border border-gray-800 rounded px-2 pt-0.5 pb-0.2">Expanded</span>
                                                <span v-if="dept.expanded && dept.loading" class="flex items-center gap-1 text-[10px] font-normal text-gray-500">
                                                    <span class="loading-ring-inline"></span>
                                                    Loading&hellip;
                                                </span>
                                                <button v-if="dept.expanded && !dept.loading" type="button"
                                                    @click.stop="exportDepartment(deptIndex)"
                                                    title="Export this department to Excel"
                                                    class="flex-shrink-0 w-5 h-5 flex items-center justify-center rounded border border-gray-400 text-green-600 hover:border-green-900 hover:shadow-md">
                                                    <i class="fas fa-file-excel text-[10px]"></i>
                                                </button>
                                            </div>
                                        </td>
                                        <!-- Per-column summary totals -- shown regardless of expand state, so
                                             the totals stay aligned under their real column headers instead of
                                             being collapsed into a single banner cell. The first 3 blank columns
                                             (Bag Number, Component Items, Stone Quality Group) are merged into a
                                             single "Total - <dept>" label while expanded, instead of showing empty. -->
                                        <td v-if="dept.expanded" class="frozen-col frozen-col-3 px-4 py-2 text-gray-900 text-[11px] font-bold bg-blue-100 border-r border-gray-300 summary-cell"></td>
                                        <td v-if="dept.expanded" class="frozen-col frozen-col-4 px-4 py-2 text-gray-900 text-[11px] font-bold bg-blue-100 summary-cell"></td>
                                        <template v-else>
                                            <td v-if="showBlankSummaryColumns" class="frozen-col frozen-col-3 px-4 py-2 border-r border-gray-300 summary-cell"></td>
                                            <td v-if="showBlankSummaryColumns" class="frozen-col frozen-col-4 px-4 py-2 summary-cell"></td>
                                        </template>
                                            <template v-if="showBlankSummaryColumns">
                                                <td v-for="n in 29" :key="'blank-' + deptIndex + '-' + n" class="px-4 py-2"></td>
                                            </template>
                                            <td class="px-4 py-2 text-right text-gray-900 bg-blue-50" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold'">{{ dept.partyDiamondWeight }}</td>
                                            <td class="px-4 py-2 text-right text-gray-900 bg-blue-50" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold'">{{ dept.actualDiamondWeightCt }}</td>
                                            <td class="px-4 py-2 text-right text-gray-900 bg-blue-50" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold'">{{ dept.expectedDiamondPieces }}</td>
                                            <td class="px-4 py-2 text-right text-gray-900 bg-blue-50" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold'">{{ dept.expectedGrossWeight }}</td>
                                            <td class="px-4 py-2 text-right text-gray-900 bg-blue-50" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold'">{{ dept.expectedComponentWeight }}</td>
                                            <td class="px-4 py-2 text-right text-gray-900 bg-blue-50" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold'">{{ dept.expectedMetalPureWeight }}</td>
                                            <td class="px-4 py-2 text-right text-gray-900 bg-blue-50" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold'">{{ dept.expectedNetWeightNew }}</td>
                                            <td class="px-4 py-2 text-right text-gray-900 bg-blue-50" :class="dept.expanded ? 'font-bold bg-blue-200' : 'font-semibold'">{{ dept.actualMetalPureWeight }}</td>
                                    </tr>
                                    <!-- Expanded detail rows for this department -->
                                    <template v-if="dept.expanded">
                                        <tr v-if="dept.error" class="bg-white">
                                            <td :colspan="TOTAL_COLUMNS" class="px-4 py-3 text-center text-red-500 text-xs">
                                                <i class="fas fa-exclamation-triangle mr-1"></i>Failed to load details.
                                                <button @click="toggleDepartment(deptIndex, true)" class="underline ml-1">Retry</button>
                                            </td>
                                        </tr>
                                        <tr v-else-if="!dept.loading && dept.detail.length === 0" class="bg-white">
                                            <td :colspan="TOTAL_COLUMNS" class="px-4 py-3 text-center text-gray-400 text-xs">No detail rows for this department.</td>
                                        </tr>
                                        <tr v-for="(row, index) in dept.detail" :key="'d-' + deptIndex + '-' + index"
                                            :data-row-key="deptIndex + '-' + index"
                                            @click="selectRow(deptIndex, index)"
                                            class="row-stripe detail-row detail-row-col-gap"
                                            :class="[index % 2 === 1 ? 'bg-gray-50' : 'bg-white', dept.isLastRowOfBagGroup[index] ? 'bag-group-end' : '', isRowSelected(deptIndex, index) ? 'row-selected' : '']">
                                            <td class="frozen-col frozen-col-1 px-4 py-1.5 text-gray-900 font-bold row-stripe-cell">{{ row.location }}</td>
                                            <td class="frozen-col frozen-col-2 px-4 py-1.5 pl-8 text-gray-900 row-stripe-cell">{{ row.presentDepartment }}</td>
                                            <td v-if="dept.bagNumberRowSpans[index] > 0" :rowspan="dept.bagNumberRowSpans[index]"
                                                class="frozen-col frozen-col-3 bag-number-cell px-4 py-1.5 text-gray-900 font-bold align-middle"
                                                :class="index % 2 === 1 ? 'bg-gray-50' : 'bg-white'">{{ row.bagNumber }}</td>
                                            <td class="frozen-col frozen-col-4 px-4 py-1.5 text-gray-900" :class="index % 2 === 1 ? 'bg-gray-50' : 'bg-white'">{{ row.componentItems }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.stoneQualityGroup }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.manufacturer }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.poNumber }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.salesOrderNo }}</td>
                                            <td class="px-4 py-1.5 font-medium text-gray-900">{{ row.workorder }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.salesExecutive }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.orderDate }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.woAgeing }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.lastMoveDays }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.orderRemarks }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.overDueDays }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.orderType }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.stockType }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.orderedQuantity }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.bagGenerationDate }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.noOfBags }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900">{{ row.quantityPerBag }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.customerName }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.deliveryDate }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.design }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.category }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.categoryCode }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.subCategory }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.productionDelays }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.issueDate }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.ringSize }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.metalStoneQuality }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.metalStoneColor }}</td>
                                            <td class="px-4 py-1.5 text-gray-900">{{ row.lotMetalIssueDays }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900 font-semibold bg-blue-50">{{ row.partyDiamondWeight }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900 font-semibold bg-blue-50">{{ row.actualDiamondWeightCt }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900 font-semibold bg-blue-50">{{ row.expectedDiamondPieces }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900 font-semibold bg-blue-50">{{ row.expectedGrossWeight }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900 font-semibold bg-blue-50">{{ row.expectedComponentWeight }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900 font-semibold bg-blue-50">{{ row.expectedMetalPureWeight }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900 font-semibold bg-blue-50">{{ row.expectedNetWeightNew }}</td>
                                            <td class="px-4 py-1.5 text-right text-gray-900 font-semibold bg-blue-50">{{ row.actualMetalPureWeight }}</td>
                                        </tr>
                                    </template>
                                </template>
                                <!-- Grand total row: sums the same SUMmed columns across every
                                     department summary, regardless of expand state. -->
                                <tr v-if="!loading && summaryRows.length > 0" class="grand-total-row font-bold">
                                    <td class="frozen-col frozen-col-1 px-4 py-2 text-gray-900 grand-total-cell"></td>
                                    <td class="frozen-col frozen-col-2 px-4 py-2 text-gray-900 grand-total-cell">GRAND TOTAL</td>
                                    <template v-if="showBlankSummaryColumns">
                                        <td class="frozen-col frozen-col-3 px-4 py-2 grand-total-cell"></td>
                                        <td class="frozen-col frozen-col-4 px-4 py-2 grand-total-cell"></td>
                                        <td v-for="n in 29" :key="'gt-blank-' + n" class="px-4 py-2 grand-total-cell"></td>
                                    </template>
                                    <td class="px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">{{ grandTotals.partyDiamondWeight }}</td>
                                    <td class="px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">{{ grandTotals.actualDiamondWeightCt }}</td>
                                    <td class="px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">{{ grandTotals.expectedDiamondPieces }}</td>
                                    <td class="px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">{{ grandTotals.expectedGrossWeight }}</td>
                                    <td class="px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">{{ grandTotals.expectedComponentWeight }}</td>
                                    <td class="px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">{{ grandTotals.expectedMetalPureWeight }}</td>
                                    <td class="px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">{{ grandTotals.expectedNetWeightNew }}</td>
                                    <td class="px-4 py-2 text-right text-gray-900 font-semibold bg-blue-50">{{ grandTotals.actualMetalPureWeight }}</td>
                                </tr>
                            </tbody>
                        </table>
                        </div>
                        <div v-if="!loading && summaryRows.length === 0"
                            class="no-records-overlay absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center text-gray-500 pointer-events-none">
                            <div class="text-center">
                                <i class="fas fa-search text-gray-400 text-lg block mb-2"></i>
                                No records found.
                            </div>
                        </div>
                        <div v-if="loading"
                            class="loading-ring-overlay absolute top-0 left-0 right-0 bottom-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
                            <div class="loading-ring"></div>
                            <span class="text-sm font-medium text-gray-600">Loading records&hellip;</span>
                        </div>
                    </div>

                    <!-- Summary footer -->
                    <div class="flex items-center justify-end mt-4">
                        <span class="text-xs font-normal text-gray-500 flex items-center gap-1.5">
                            <span v-if="loading" class="inline-block w-3 h-3 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                            <template v-if="!loading">{{ summaryRows.length }} departments</template>
                            <template v-else>Loading summary&hellip;</template>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue';
import { useToast } from "vue-toast-notification";
import ExcelJS from 'exceljs';
import { useAllReportsApi } from '../services/NetSuite_API';
import SearchableSelect from '../components/SearchableSelect.vue';

export default {
    name: 'ActualWIPReport',
    components: { SearchableSelect },
    setup() {
        const $toast = useToast();
        const {
            fetchActualWipSummary,
            actualWipSummary,
            fetchActualWipDepartmentDetail,
            fetchManufacturingDepartments,
            manufacturingDepartments,
        } = useAllReportsApi();
        const loading = ref(true);
        const filterOptionsLoading = ref(true);

        const skeletonRowCount = 12;

        // Number of <td> columns per row -- used by full-width message rows
        // (colspan) inside an expanded department (error / no-detail states).
        const TOTAL_COLUMNS = 43;

        // One entry per department: the summary aggregate plus this row's own
        // expansion state. Detail rows are fetched lazily (one API call per
        // department) the first time it's expanded and cached thereafter, so
        // the whole dataset is never pulled into the page at once.
        const summaryRows = ref([]);

        // Every visible row shares one <table>, so columns must line up across
        // all of them -- a column can't be hidden on the summary row while
        // shown on an expanded department's detail rows in the same table.
        // Instead: the columns that are always blank on a pure summary view
        // (everything except Location/Present Department and the SUMmed
        // quantity/weight fields) stay hidden while every department is
        // collapsed, and reappear -- for every row, summary and detail alike
        // -- as soon as at least one department is expanded.
        const showBlankSummaryColumns = computed(() => summaryRows.value.some((dept) => dept.expanded));

        // Column keys SUMmed across every department in the grand total row --
        // the same set of quantity/weight fields shown per-department in the
        // summary view.
        const GRAND_TOTAL_KEYS = [
            'orderedQuantity', 'noOfBags', 'quantityPerBag', 'partyDiamondWeight',
            'actualDiamondWeightCt', 'expectedDiamondPieces', 'expectedGrossWeight',
            'expectedComponentWeight', 'expectedDiamondWeight', 'expectedGrossWeightNew', 'expectedMetalPureWeight',
            'expectedNetWeightNew', 'actualMetalPureWeight',
        ];

        // Grand total across every department's summary row (not affected by
        // which department, if any, is currently expanded).
        const grandTotals = computed(() => {
            const totals = {};
            GRAND_TOTAL_KEYS.forEach((key) => {
                totals[key] = summaryRows.value.reduce((sum, dept) => sum + (Number(dept[key]) || 0), 0);
                totals[key] = Math.round(totals[key] * 1000) / 1000;
            });
            return totals;
        });

        // Which detail row is currently "selected" (persistently highlighted
        // by click), identified by its department index + row index. Replaces
        // the old :hover highlight -- hover on a large sticky-column table was
        // causing the browser to visibly stick/lag on repaint, so highlighting
        // now only changes on click instead of tracking every mouse move.
        const selectedRowKey = ref(null);

        const selectRow = (deptIndex, index) => {
            const key = `${deptIndex}-${index}`;
            selectedRowKey.value = selectedRowKey.value === key ? null : key;
        };

        const isRowSelected = (deptIndex, index) => selectedRowKey.value === `${deptIndex}-${index}`;

        // Arrow-key navigation moves the highlight up/down through the
        // currently expanded department's detail rows (only one department
        // can be expanded at a time, so there's only ever one visible list of
        // detail rows to navigate). Ignored while the user is typing into a
        // form field so it doesn't hijack normal text-input arrow-key use.
        const onDetailRowArrowKey = (event) => {
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') { return; }
            const target = event.target;
            if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) { return; }

            const deptIndex = summaryRows.value.findIndex((dept) => dept.expanded);
            if (deptIndex === -1) { return; }
            const detail = summaryRows.value[deptIndex].detail;
            if (!detail.length) { return; }

            event.preventDefault();

            const [selectedDeptIndex, selectedIndexStr] = (selectedRowKey.value || '').split('-');
            const currentIndex = Number(selectedDeptIndex) === deptIndex ? Number(selectedIndexStr) : -1;

            let nextIndex;
            if (event.key === 'ArrowDown') {
                nextIndex = currentIndex < 0 ? 0 : Math.min(currentIndex + 1, detail.length - 1);
            } else {
                nextIndex = currentIndex < 0 ? detail.length - 1 : Math.max(currentIndex - 1, 0);
            }
            selectedRowKey.value = `${deptIndex}-${nextIndex}`;

            const rowEl = document.querySelector(`tr[data-row-key="${deptIndex}-${nextIndex}"]`);
            if (rowEl) { rowEl.scrollIntoView({ block: 'nearest' }); }
        };

        onMounted(() => document.addEventListener('keydown', onDetailRowArrowKey));
        onBeforeUnmount(() => document.removeEventListener('keydown', onDetailRowArrowKey));

        // TEMPORARY (sandbox only): defaults the Date From/To filters to
        // today's date so the report opens already scoped to "today's work"
        // instead of the full unfiltered dataset. The sandbox has no data for
        // the actual current date, so it's pinned to 2026-07-14 for now --
        // swap DEFAULT_FILTER_DATE back to getTodayDateString() (or just
        // inline it below) once real/production data makes "today" usable.
        const getTodayDateString = () => {
            const now = new Date();
            return now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, '0') + "-" +
                String(now.getDate()).padStart(2, '0');
        };
        const DEFAULT_FILTER_DATE = '2026-07-14'; // sandbox stand-in for getTodayDateString()

        const filters = ref({
            location: '',
            department: '',
            dateFrom: DEFAULT_FILTER_DATE,
            dateTo: DEFAULT_FILTER_DATE,
            salesOrderNo: '',
            workOrderNo: '',
            bagNumber: '',
        });
        const appliedFilters = ref({ dateFrom: DEFAULT_FILTER_DATE, dateTo: DEFAULT_FILTER_DATE });

        // Whether clicking Apply Filters right now would actually change what
        // the table is showing. Comparing against appliedFilters (not just
        // "is anything typed") is what matters here: if the user clears every
        // field, filters is empty but appliedFilters still holds the default
        // date -- that IS a real, unapplied change (it would switch the table
        // from "today's data" to the full unfiltered dataset), so Apply must
        // stay enabled for it. Disabling based on "filters is empty" alone
        // left no way to ever load the full dataset once the default date was
        // cleared, since the table kept showing the last-applied (dated)
        // results with no enabled button to refresh away from them.
        const ALL_FILTER_KEYS = ['location', 'department', 'dateFrom', 'dateTo', 'salesOrderNo', 'workOrderNo', 'bagNumber'];
        const filtersPendingApply = computed(() => {
            return ALL_FILTER_KEYS.some((key) => (filters.value[key] || '') !== (appliedFilters.value[key] || ''));
        });

        // Consecutive rows sharing the same Bag Number belong to one bag's
        // component breakdown -- merge them into a single spanning cell
        // instead of repeating the bag number on every line. Computed per
        // department's own detail array (only adjacent rows, which the backend
        // already orders by bag generation ID).
        const computeBagNumberRowSpans = (rows) => {
            const spans = new Array(rows.length).fill(0);
            let groupStart = 0;
            for (let i = 1; i <= rows.length; i++) {
                if (i === rows.length || rows[i].bagNumber !== rows[groupStart].bagNumber) {
                    spans[groupStart] = i - groupStart;
                    groupStart = i;
                }
            }
            return spans;
        };

        // Marks the last row of each bag-number group so a divider border can
        // be drawn under it, visually separating one bag's rows from the next.
        const computeIsLastRowOfBagGroup = (rows) => {
            return rows.map((row, i) => i === rows.length - 1 || rows[i + 1].bagNumber !== row.bagNumber);
        };

        // Load the department-level summary (one row per department). This is
        // the initial view and what a filter apply/clear reloads.
        const loadSummary = async () => {
            loading.value = true;
            try {
                await fetchActualWipSummary({ filters: appliedFilters.value });
                const rows = (actualWipSummary.value && actualWipSummary.value.data) || [];
                summaryRows.value = rows.map((row) => ({
                    ...row,
                    expanded: false,
                    loading: false,
                    error: false,
                    detail: [],
                    bagNumberRowSpans: [],
                    isLastRowOfBagGroup: [],
                }));
            } catch (error) {
                summaryRows.value = [];
                $toast.error("Error fetching summary", { position: "top" });
            } finally {
                loading.value = false;
            }
        };

        // Expand/collapse a single department. Only one department can be
        // expanded at a time, so expanding one collapses whichever other
        // department was previously open. On first expand (or a retry) the
        // department's detail rows are fetched via their own API call and
        // cached on the row; subsequent expands just toggle visibility.
        const toggleDepartment = async (deptIndex, forceReload = false) => {
            const dept = summaryRows.value[deptIndex];
            if (!dept) { return; }

            // Collapse if already open (unless we're forcing a reload/retry).
            if (dept.expanded && !forceReload) {
                dept.expanded = false;
                return;
            }

            summaryRows.value.forEach((other, i) => {
                if (i !== deptIndex) { other.expanded = false; }
            });

            dept.expanded = true;

            // Already have cached detail and not retrying -> nothing to fetch.
            if (dept.detail.length > 0 && !forceReload) { return; }

            dept.loading = true;
            dept.error = false;
            try {
                const detail = await fetchActualWipDepartmentDetail({
                    department: dept.presentDepartment,
                    filters: appliedFilters.value,
                });
                dept.detail = detail || [];
                dept.bagNumberRowSpans = computeBagNumberRowSpans(dept.detail);
                dept.isLastRowOfBagGroup = computeIsLastRowOfBagGroup(dept.detail);
            } catch (error) {
                dept.error = true;
                dept.detail = [];
                $toast.error("Error loading department details", { position: "top" });
            } finally {
                dept.loading = false;
            }
        };

        // No "at least one filter required" guard here: the summary view is
        // always compact (one row per department), so it's safe to load
        // completely unfiltered -- e.g. after a user clears the Date From/To
        // fields specifically to see the full, unfiltered dataset. Blocking
        // that with a toast left no way to view all data once the default
        // date filter (see DEFAULT_FILTER_DATE) had been cleared.
        const applyFilters = async () => {
            appliedFilters.value = { ...filters.value };
            await loadSummary();
        };

        const clearFilters = async () => {
            filters.value = {
                location: '',
                department: '',
                dateFrom: DEFAULT_FILTER_DATE,
                dateTo: DEFAULT_FILTER_DATE,
                salesOrderNo: '',
                workOrderNo: '',
                bagNumber: '',
            };
            appliedFilters.value = { dateFrom: DEFAULT_FILTER_DATE, dateTo: DEFAULT_FILTER_DATE };
            await loadSummary();
        };

        const pasteInto = async (field) => {
            try {
                const text = await navigator.clipboard.readText();
                if (text) { filters.value[field] = text.trim(); }
            } catch (err) {
                console.error('Clipboard paste failed:', err);
            }
        };

        // Distinct, alphabetically sorted location names across every
        // manufacturing department row (a location can host multiple
        // departments, so this de-dupes rather than listing one per row).
        const locationOptions = computed(() => {
            const names = manufacturingDepartments.value
                .map((row) => row.locationName)
                .filter((name) => !!name);
            return Array.from(new Set(names)).sort();
        });

        // Department options narrow to whichever location is currently typed
        // into the Location filter -- picking a location first limits the
        // Department dropdown to only the departments under that location.
        // Departments with no location (locationName null) always show, since
        // there's nothing to filter them against.
        const departmentOptions = computed(() => {
            const selectedLocation = filters.value.location;
            const rows = selectedLocation
                ? manufacturingDepartments.value.filter((row) => !row.locationName || row.locationName === selectedLocation)
                : manufacturingDepartments.value;
            const names = rows.map((row) => row.departmentName).filter((name) => !!name);
            return Array.from(new Set(names)).sort();
        });

        // If the user had already picked a department and then changes (or
        // clears) the location to one that department isn't under, drop the
        // now-invalid department selection instead of silently filtering on
        // a value no longer offered in its own dropdown.
        watch(() => filters.value.location, () => {
            if (filters.value.department && !departmentOptions.value.includes(filters.value.department)) {
                filters.value.department = '';
            }
        });

        const loadFilterOptions = async () => {
            filterOptionsLoading.value = true;
            try {
                await fetchManufacturingDepartments();
            } finally {
                filterOptionsLoading.value = false;
            }
        };

        onMounted(async () => {
            await Promise.all([loadSummary(), loadFilterOptions()]);
        });

        const getTimestamp = () => {
            const now = new Date();
            return now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, '0') + "-" +
                String(now.getDate()).padStart(2, '0') + "_" +
                String(now.getHours()).padStart(2, '0') + "-" +
                String(now.getMinutes()).padStart(2, '0') + "-" +
                String(now.getSeconds()).padStart(2, '0');
        };

        const exportColumns = [
            ["Location", "location"],
            ["Present Department", "presentDepartment"],
            ["Bag Number", "bagNumber"],
            ["Component Items", "componentItems"],
            ["Stone Quality Group", "stoneQualityGroup"],
            ["Manufacturer", "manufacturer"],
            ["PO Number", "poNumber"],
            ["Sales Order No", "salesOrderNo"],
            ["Work Order No", "workorder"],
            ["Sales Executive", "salesExecutive"],
            ["Order Date", "orderDate"],
            ["WO Ageing", "woAgeing"],
            ["LAST Move Days", "lastMoveDays"],
            ["Order Remarks", "orderRemarks"],
            ["OverDue Days", "overDueDays"],
            ["Order Type", "orderType"],
            ["Stock Type", "stockType"],
            ["Ordered Quantity", "orderedQuantity"],
            ["Bag Generation Date", "bagGenerationDate"],
            ["No Of Bags", "noOfBags"],
            ["Quantity Per Bag", "quantityPerBag"],
            ["Customer Name", "customerName"],
            ["Delivery Date", "deliveryDate"],
            ["Design", "design"],
            ["Category", "category"],
            ["Category Code", "categoryCode"],
            ["Sub Category", "subCategory"],
            ["Production Delays", "productionDelays"],
            ["Issue Date", "issueDate"],
            ["Ring Size", "ringSize"],
            ["Metal/Stone Quality", "metalStoneQuality"],
            ["Metal/Stone Color", "metalStoneColor"],
            ["Party Diamond Weight", "partyDiamondWeight"],
            ["Actual Diamond Weight (CT)", "actualDiamondWeightCt"],
            ["Lot Metal Issue days", "lotMetalIssueDays"],
            ["Expected Diamond Pieces new", "expectedDiamondPieces"],
            ["Expected Diamond Weight test", "expectedGrossWeight"],
            ["Expected Component Weight", "expectedComponentWeight"],
            ["Expected Diamond Weight", "expectedDiamondWeight"],
            ["Expected Gross Weight NEW", "expectedGrossWeightNew"],
            ["Expected Metal Pure Weight", "expectedMetalPureWeight"],
            ["Expected Net Weight New", "expectedNetWeightNew"],
            ["Actual Metal Pure Weight", "actualMetalPureWeight"],
        ];

        // Keys that are always blank on a pure department summary row (no
        // department expanded) -- the same set hidden on screen behind
        // showBlankSummaryColumns. Excluded from the export entirely while
        // nothing is expanded, since an all-blank column adds nothing to a
        // summary-only file; reappear once any department is expanded and the
        // export includes real detail rows for those fields.
        const blankInSummaryKeys = new Set([
            'bagNumber', 'componentItems', 'stoneQualityGroup', 'manufacturer',
            'poNumber', 'salesOrderNo', 'workorder', 'salesExecutive', 'orderDate',
            'woAgeing', 'lastMoveDays', 'orderRemarks', 'overDueDays', 'orderType',
            'stockType', 'orderedQuantity', 'bagGenerationDate', 'noOfBags', 'quantityPerBag',
            'customerName', 'deliveryDate',
            'design', 'category', 'categoryCode', 'subCategory', 'productionDelays',
            'issueDate', 'ringSize', 'metalStoneQuality', 'metalStoneColor',
            'lotMetalIssueDays',
        ]);

        // Column list for the top-level (whole-report) export: always the
        // summary view's columns -- minus the always-blank ones -- regardless
        // of whether any department happens to be expanded on screen. The
        // whole-report export is purely a summary export; per-department
        // detail only comes from exportDepartment's own dedicated export.
        const activeExportColumns = computed(() => {
            return exportColumns.filter(([, key]) => !blankInSummaryKeys.has(key));
        });

        // Overrides the default label-length column width for fields whose
        // content tends to run much longer or shorter than their header --
        // free-text fields (remarks, names, items) need extra room; single
        // short values (sizes, day counts) don't need the header's full width.
        const exportColumnWidthOverrides = {
            componentItems: 30,
            orderRemarks: 30,
            customerName: 45,
            design: 20,
            metalStoneQuality: 22,
            metalStoneColor: 20,
            salesExecutive: 30,
            manufacturer: 30,
            ringSize: 10,
            woAgeing: 10,
            lastMoveDays: 12,
            overDueDays: 12,
            lotMetalIssueDays: 14,
            stockType: 16,
            category: 25,
            subCategory: 25,
            issueDate: 25,
        };

        // The top-level export is always a pure department summary -- one row
        // per department with only the SUMmed quantity/weight columns -- no
        // detail rows, even for departments currently expanded on screen. To
        // export a department's own detail rows, use its per-department
        // export instead (see exportDepartment below).
        const buildExportRows = () => {
            return summaryRows.value.map((dept) => ({ ...dept, presentDepartment: dept.presentDepartment }));
        };

        // Both export functions default to the full summary+expanded view, but
        // accept an explicit row set and filename slug so a single expanded
        // department can be exported on its own (see exportDepartment below).
        // Slug-ify a department name for use in an exported filename. Keeps
        // the department's own casing (e.g. "2D-3D DESIGN") and only collapses
        // whitespace/punctuation runs into single underscores, matching the
        // WIP_Report_<dept_name>_... filename convention.
        const slugify = (text) => {
            return String(text || 'Department')
                .trim()
                .replace(/[^a-zA-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '') || 'Department';
        };

        // Exports the expanded department's own detail rows, followed by a
        // Grand Total row summing that SAME department's own SUMmed values
        // (not the whole report's) -- so the export mirrors what's on screen
        // for that one department, ending in its own total rather than the
        // whole report's.
        const exportDepartment = (deptIndex) => {
            const dept = summaryRows.value[deptIndex];
            if (!dept) { return; }
            const rows = dept.detail;
            const slug = `WIP_Report_${slugify(dept.presentDepartment)}`;
            const deptTotals = {};
            GRAND_TOTAL_KEYS.forEach((key) => { deptTotals[key] = dept[key]; });
            // A single-department export always includes its own detail rows,
            // so it always gets the full column list regardless of whether
            // any OTHER department happens to be expanded.
            downloadExcel(rows, slug, exportColumns, dept.bagNumberRowSpans, dept.isLastRowOfBagGroup, true, deptTotals, `TOTAL - ${dept.presentDepartment.toUpperCase()}`);
        };

        // Mirrors the on-screen table: dark header row (Tailwind bg-gray-700),
        // white header text, alternating white/bg-gray-50 row stripes, thin
        // borders, and the Location/Present Department columns frozen -- so
        // the exported file reads as the same view, not a bare data dump.
        // bagSpans (optional): the same run-length array computeBagNumberRowSpans
        // produces for the on-screen table -- bagSpans[i] is the number of
        // consecutive rows the bag number at row i covers, 0 for rows that are
        // part of a preceding span. When given, the Bag Number column's cells
        // are merged/vertically-centered the same way the table visually
        // spans them, instead of repeating the bag number on every line.
        // bagGroupEnds (optional): computeIsLastRowOfBagGroup's parallel array
        // -- true for the last row of each bag's group. When given, that row
        // gets a thick bottom border across every column, mirroring the
        // on-screen .bag-group-end divider that separates one bag's rows from
        // the next.
        // includeGrandTotal (optional): when true, appends one extra row at the
        // bottom summing the SUMmed columns. Defaults to the whole-report
        // grandTotals (across every department); pass totalsOverride to sum a
        // single department's own values instead (see exportDepartment, which
        // exports one department's detail rows followed by that department's
        // own total, not the whole report's).
        const downloadExcel = async (rows_ = null, filenameSlug = 'WIP_Report_Summary', columns_ = null, bagSpans = null, bagGroupEnds = null, includeGrandTotal = false, totalsOverride = null, totalRowLabel = 'GRAND TOTAL') => {
            const columns = columns_ || activeExportColumns.value;
            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet('Actual WIP Report', {
                views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],
            });

            sheet.columns = columns.map(([label, key]) => ({
                header: label.toUpperCase(),
                width: exportColumnWidthOverrides[key] || Math.max(label.length + 2, 12),
            }));

            const exportRows = rows_ || buildExportRows();
            exportRows.forEach((row) => {
                sheet.addRow(columns.map(([, key]) => row[key]));
            });

            let grandTotalRowNumber = null;
            if (includeGrandTotal) {
                const totals = totalsOverride || grandTotals.value;
                const totalRow = sheet.addRow(columns.map(([, key], colIndex) => {
                    if (colIndex === 1) { return totalRowLabel; } // Present Department column
                    if (colIndex === 0) { return ''; } // Location column
                    return Object.prototype.hasOwnProperty.call(totals, key) ? totals[key] : '';
                }));
                grandTotalRowNumber = totalRow.number;
            }

            if (bagSpans) {
                const bagNumberColIndex = columns.findIndex(([, key]) => key === 'bagNumber');
                if (bagNumberColIndex !== -1) {
                    const bagNumberCol = bagNumberColIndex + 1;
                    bagSpans.forEach((span, i) => {
                        if (span > 1) {
                            const startRow = i + 2; // +1 for header row, +1 for 1-based index
                            const endRow = startRow + span - 1;
                            sheet.mergeCells(startRow, bagNumberCol, endRow, bagNumberCol);
                            const mergedCell = sheet.getCell(startRow, bagNumberCol);
                            mergedCell.alignment = { vertical: 'middle', horizontal: 'left' };
                        }
                    });
                }
            }

            const headerRow = sheet.getRow(1);
            headerRow.eachCell((cell) => {
                cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
                cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
                cell.alignment = { vertical: 'middle', horizontal: 'center' };
            });
            headerRow.height = 28;

            // Location and Bag Number read as row/group labels on screen (both
            // rendered font-bold there) -- bold them here too instead of the
            // plain-weight text used for every other column.
            const locationColIndex = columns.findIndex(([, key]) => key === 'location');
            const boldColIndexes = new Set([locationColIndex, columns.findIndex(([, key]) => key === 'bagNumber')].filter((i) => i !== -1));

            // Numeric/quantity/weight columns are right-aligned on screen
            // (text-right) -- match that here instead of ExcelJS's default
            // left alignment for these fields.
            const rightAlignKeys = new Set([
                'woAgeing', 'lastMoveDays', 'overDueDays', 'orderedQuantity', 'noOfBags',
                'quantityPerBag', 'partyDiamondWeight', 'actualDiamondWeightCt',
                'lotMetalIssueDays', 'expectedDiamondPieces', 'expectedGrossWeight',
                'expectedComponentWeight', 'expectedDiamondWeight', 'expectedGrossWeightNew', 'expectedMetalPureWeight',
                'expectedNetWeightNew', 'actualMetalPureWeight',
            ]);
            const rightAlignColIndexes = new Set(
                columns.map(([, key], i) => (rightAlignKeys.has(key) ? i : -1)).filter((i) => i !== -1)
            );

            const thinBorder = { style: 'thin', color: { argb: 'FFE5E7EB' } };
            const groupEndBorder = { style: 'medium', color: { argb: 'FF374151' } };
            sheet.eachRow((row, rowNumber) => {
                if (rowNumber === 1) { return; }
                row.height = 20;

                // Grand total row: dark fill/white bold text, matching the
                // on-screen grand-total row -- not part of the striping or
                // bag-group-border logic below.
                if (rowNumber === grandTotalRowNumber) {
                    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                        cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
                        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF374151' } };
                        cell.border = { top: { style: 'medium', color: { argb: 'FF1F2937' } }, bottom: thinBorder, left: thinBorder, right: thinBorder };
                        if (rightAlignColIndexes.has(colNumber - 1)) {
                            cell.alignment = { horizontal: 'right' };
                        }
                    });
                    return;
                }

                const isStriped = rowNumber % 2 === 0;
                const dataIndex = rowNumber - 2; // -1 for header row, -1 for 1-based index
                const isGroupEnd = bagGroupEnds ? Boolean(bagGroupEnds[dataIndex]) : false;
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    cell.fill = {
                        type: 'pattern',
                        pattern: 'solid',
                        fgColor: { argb: isStriped ? 'FFF9FAFB' : 'FFFFFFFF' },
                    };
                    cell.border = {
                        top: thinBorder,
                        bottom: isGroupEnd ? groupEndBorder : thinBorder,
                        left: thinBorder,
                        right: thinBorder,
                    };
                    if (boldColIndexes.has(colNumber - 1)) {
                        cell.font = { bold: true };
                    }
                    if (rightAlignColIndexes.has(colNumber - 1)) {
                        cell.alignment = { horizontal: 'right' };
                    }
                });
            });

            const timestamp = getTimestamp();
            const filename = `${filenameSlug}_${timestamp}.xlsx`;

            const buffer = await workbook.xlsx.writeBuffer();
            const blob = new Blob([buffer], { type: 'application/octet-stream' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        };

        return {
            loading,
            skeletonRowCount,
            TOTAL_COLUMNS,
            summaryRows,
            showBlankSummaryColumns,
            grandTotals,
            toggleDepartment,
            selectRow,
            isRowSelected,
            downloadExcel,
            exportDepartment,
            filters,
            applyFilters,
            filtersPendingApply,
            clearFilters,
            pasteInto,
            locationOptions,
            departmentOptions,
            filterOptionsLoading,
        };
    }
};
</script>
<style scoped>
body{
    padding: 0;
    margin: 0;
}
.badge {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 10px;
    border-radius: 9999px;
    display: inline-block;
}

.badge-progress {
    background-color: #FEF3C7;
    color: #92400E;
}

.badge-done {
    background-color: #D1FAE5;
    color: #065F46;
}

.badge-pending {
    background-color: #E5E7EB;
    color: #374151;
}

.table-main-wrapper {
    height: 700px;
    overflow: hidden;
}

.table-main {
    height: 100%;
    overflow: auto;
    font-size: 11px;
}

.no-records-overlay {
    z-index: 9999;
    font-size: 16px;
    background-color: #ffffff00;
}

.loading-ring-overlay {
    z-index: 9999;
    background-color: rgba(255, 255, 255, 0.4);
}

.loading-ring {
    width: 40px;
    height: 40px;
    border: 4px solid #e5e7eb;
    border-top-color: #374151;
    border-radius: 50%;
    animation: loading-ring-spin 0.8s linear infinite;
}

/* Small inline spinner for the "Loading records..." label shown inside an
   expanding department's banner row, reusing the same spin keyframe as the
   full-table loading overlay. */
.loading-ring-inline {
    display: inline-block;
    width: 12px;
    height: 12px;
    border: 2px solid #d1d5db;
    border-top-color: #000000;
    border-radius: 50%;
    animation: loading-ring-spin 0.8s linear infinite;
}

@keyframes loading-ring-spin {
    to {
        transform: rotate(360deg);
    }
}

.table-main thead th {
    position: sticky;
    top: 0;
    z-index: 20;
}

.table-main .frozen-col {
    position: sticky;
    z-index: 10;
}

.table-main .frozen-col-1 {
    left: 0;
    width: 140px;
    min-width: 140px;
    max-width: 140px;
    z-index: 11;
}

.table-main .frozen-col-2 {
    left: 140px;
    width: 220px;
    min-width: 220px;
    max-width: 220px;
    z-index: 12;
}

.table-main .frozen-col-3 {
    left: 360px;
    width: 110px;
    min-width: 110px;
    max-width: 110px;
    z-index: 13;
}

.table-main .frozen-col-4 {
    left: 470px;
    width: 180px;
    min-width: 180px;
    max-width: 180px;
    z-index: 14;
}

.table-main .frozen-col-4::after {
    content: '';
    position: absolute;
    top: 0;
    right: -2px;
    bottom: 0;
    width: 2px;
    background-color: #374151;
    z-index: 40;
    pointer-events: none;
}

.table-main td.summary-total-frozen {
    width: auto;
    min-width: 0;
    max-width: none;
}

.table-main thead th.frozen-col {
    z-index: 30;
}

.table-main tbody td.frozen-col {
    z-index: 15;
}

.row-stripe.row-selected {
    background-image: linear-gradient(to bottom, #ffffff, #cbcbcb);
    border-left: 4px solid #374151;
}

.row-stripe.row-selected td.bag-number-cell {
    background-image: none;
}

.row-stripe-cell {
    background-color: inherit;
}

.row-stripe td {
    transition: box-shadow 0.15s ease, background-color 0.15s ease;
}

.row-stripe {
    cursor: pointer;
}

.bag-group-end td {
    border-bottom: 2px solid #374151;
}

.bag-group-end td.frozen-col {
    border-bottom: none;
}

.bag-number-cell {
    border-bottom: 2px solid #374151;
}

tr {
    transition: background-color 0.15s ease;
}

/* Department summary rows: visually distinct header-like band, with the two
   frozen columns matching the row's background so they don't show through. */
.summary-row td {
    border-top: 0.5px solid #d1d5db;
    border-bottom: 0.5px solid #374151;
}

.summary-row:not(.bg-blue-100):hover td {
    transition: box-shadow 0.15s ease, background-color 0.15s ease;
    background-color: #bfdbfe;
}

/* Grand total row: sits at the very bottom of the body, styled distinctly
   dark (matching the table header) so it reads clearly as a final total
   rather than another department. */
.grand-total-row td {
    background-color: #374151;
    color: #ffffff;
    border-top: 2px solid #1f2937;
}

.grand-total-cell {
    background-color: #374151;
    color: #ffffff;
}

.expand-btn {
    transition: background-color 0.15s ease, color 0.15s ease;
}

.summary-row .frozen-col {
    position: sticky;
}

.summary-row .frozen-col-1,
.summary-row .frozen-col-2,
.summary-row .frozen-col-3,
.summary-row .frozen-col-4 {
    background-color: inherit;
}

/* Expanded detail rows: a thin right-hand gap after every column so adjacent
   values don't visually run together now that many more columns are shown
   at once. */
.detail-row-col-gap > td {
    border-right: 1px solid #e5e7eb;
}

.detail-row-col-gap > td:last-child {
    border-right: none;
}
</style>
