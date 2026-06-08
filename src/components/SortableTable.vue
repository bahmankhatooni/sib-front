<!-- src/components/SortableTable.vue
     جدول مشترک با قابلیت مرتب‌سازی و تمام مقادیر وسط‌چین
-->
<template>
  <div class="table-card">
    <table class="data-table">
      <thead>
        <tr>
          <th
            v-for="col in columns"
            :key="col.key"
            :class="[
              col.sortable !== false ? 'sortable-th' : '',
              sortKey === col.key ? 'th-active' : ''
            ]"
            @click="col.sortable !== false && toggleSort(col.key)"
          >
            <div class="th-inner">
              <span>{{ col.label }}</span>
              <span v-if="col.sortable !== false" class="sort-icon">
                <q-icon
                  v-if="sortKey === col.key"
                  :name="sortDir === 'asc' ? 'arrow_upward' : 'arrow_downward'"
                  size="13px"
                  class="sort-active-icon"
                />
                <q-icon v-else name="unfold_more" size="13px" class="sort-idle-icon" />
              </span>
            </div>
          </th>
        </tr>
      </thead>
      <tbody>
        <!-- ردیف خالی -->
        <tr v-if="!sortedRows.length">
          <td :colspan="columns.length" class="empty-row">
            <q-icon :name="emptyIcon" size="38px" color="grey-4" />
            <p>{{ emptyText }}</p>
          </td>
        </tr>

        <!-- ردیف‌های داده -->
        <tr v-for="(row, i) in sortedRows" :key="row.id ?? i">
          <slot :row="row" :index="i" />
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script>
import { ref, computed } from 'vue'

export default {
  name: 'SortableTable',
  props: {
    // تعریف ستون‌ها: [{ key, label, sortable?, getValue? }]
    columns:   { type: Array,  required: true },
    rows:      { type: Array,  required: true },
    emptyIcon: { type: String, default: 'table_rows' },
    emptyText: { type: String, default: 'داده‌ای یافت نشد' },
    // ستون پیش‌فرض برای مرتب‌سازی
    defaultSort: { type: String, default: '' },
    defaultDir:  { type: String, default: 'asc' },
  },
  setup (props) {
    const sortKey = ref(props.defaultSort)
    const sortDir = ref(props.defaultDir)

    const toggleSort = (key) => {
      if (sortKey.value === key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
      } else {
        sortKey.value = key
        sortDir.value = 'asc'
      }
    }

    const sortedRows = computed(() => {
      if (!sortKey.value) return props.rows

      const col = props.columns.find(c => c.key === sortKey.value)
      const getValue = col?.getValue ?? ((row) => row[sortKey.value])

      return [...props.rows].sort((a, b) => {
        const va = getValue(a) ?? ''
        const vb = getValue(b) ?? ''
        const cmp = String(va).localeCompare(String(vb), 'fa', { numeric: true })
        return sortDir.value === 'asc' ? cmp : -cmp
      })
    })

    return { sortKey, sortDir, sortedRows, toggleSort }
  }
}
</script>

<style lang="scss" scoped>
// ─── کارت جدول ────────────────────────────────────────────────────────────────
.table-card {
  background: #fff;
  border: 1.5px solid #c6e8d8;
  border-radius: 12px;
  overflow: hidden;
  direction: rtl;
  box-shadow: 0 1px 4px rgba(30,138,94,.06);
}

// ─── جدول ─────────────────────────────────────────────────────────────────────
.data-table {
  width: 100%;
  border-collapse: collapse;
  font-family: 'Vazirmatn', sans-serif;
  direction: rtl;

  // ─── هدر ──────────────────────────────────────────────────────────────────
  th {
    padding: 11px 12px;
    font-size: 11.5px;
    font-weight: 700;
    color: #475569;
    background: #f0faf6;
    border-bottom: 2px solid #c6e8d8;
    white-space: nowrap;
    text-align: center;           /* وسط‌چین */
    user-select: none;
  }

  .sortable-th {
    cursor: pointer;
    transition: background .15s;
    &:hover { background: #e4f5ec; }
  }

  .th-active { background: #d6f0e5 !important; color: #1e8a5e !important; }

  .th-inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .sort-idle-icon   { color: #b0c8bc; }
  .sort-active-icon { color: #1e8a5e; }

  // ─── بدنه ─────────────────────────────────────────────────────────────────
  td {
    padding: 11px 12px;
    font-size: 13px;
    color: #334155;
    border-bottom: 1px solid #f0f9f4;
    vertical-align: middle;
    text-align: center;           /* وسط‌چین */
  }

  tbody tr:last-child td { border-bottom: none; }
  tbody tr:hover td { background: #f8fdfb; }
}

// ─── ردیف خالی ────────────────────────────────────────────────────────────────
.empty-row {
  text-align: center !important;
  padding: 44px 16px !important;
  color: #94a3b8;
  p { margin-top: 10px; font-size: 14px; }
}
</style>
