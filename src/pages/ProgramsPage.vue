<!-- src/pages/ProgramsPage.vue -->
<template>
  <div class="page-root">

    <PageHeader title="مدیریت برنامه‌ها" subtitle="تعریف و مدیریت برنامه‌های عملیاتی" icon="event_note">
      <q-btn unelevated color="primary" icon="add" label="برنامه جدید" @click="openDialog()" />
    </PageHeader>

    <div class="filter-bar">
      <q-input v-model="search" outlined dense placeholder="جستجو در عنوان یا کد برنامه..." clearable style="max-width:320px" @update:model-value="handleSearch">
        <template #prepend><q-icon name="search" size="18px" color="grey-5" /></template>
      </q-input>
      <q-select v-model="targetFilter" outlined dense :options="targetOpts" label="هدف" clearable style="min-width:200px" @update:model-value="handleTargetFilter" />
      <span class="stat-chip">{{ pagination.total }} برنامه</span>
    </div>

    <SortableTable
      :columns="columns"
      :rows="rows"
      empty-icon="event_note"
      empty-text="برنامه‌ای یافت نشد"
      default-sort="title"
      :loading="loading"
    >
      <template #default="{ row, index }">
        <td class="text-center">{{ (pagination.current_page - 1) * pagination.per_page + index + 1 }}</td>
        <td><code class="code-chip">{{ row.code }}</code></td>
        <td><span class="row-name">{{ row.title }}</span></td>
        <td>
          <div class="target-ref">
            <code class="code-chip code-sm">{{ row.target?.code || '—' }}</code>
            <span class="target-title">{{ row.target?.title || '—' }}</span>
          </div>
        </td>
        <td>
          <div class="prog-wrap">
            <div class="prog-track"><div class="prog-fill" :style="{ width: (row.progress || 0) + '%' }"></div></div>
            <span class="prog-text">{{ row.progress || 0 }}%</span>
          </div>
        </td>
        <td><span class="count-badge"><q-icon name="checklist_rtl" size="13px" class="q-ml-xs" />{{ row.tasks_count || 0 }}</span></td>
        <td>
          <div class="action-btns">
            <button class="act-btn act-view"   @click="viewTasks(row)"  title="اقدامات"><q-icon name="list" size="16px" /></button>
            <button class="act-btn act-edit"   @click="openDialog(row)" title="ویرایش"><q-icon name="edit" size="16px" /></button>
            <button class="act-btn act-delete" @click="deleteRow(row)"  title="حذف"><q-icon name="delete_outline" size="16px" /></button>
          </div>
        </td>
      </template>
    </SortableTable>

    <!-- Pagination -->
    <div class="pagination-wrapper" v-if="pagination.last_page > 1">
      <q-pagination
        v-model="pagination.current_page"
        :max="pagination.last_page"
        :max-pages="5"
        direction-links
        boundary-links
        @update:model-value="goToPage"
      />
      <span class="pagination-info">
        نمایش {{ ((pagination.current_page - 1) * pagination.per_page) + 1 }} تا
        {{ Math.min(pagination.current_page * pagination.per_page, pagination.total) }} از
        {{ pagination.total }} برنامه
      </span>
    </div>

    <!-- دیالوگ ایجاد/ویرایش -->
    <q-dialog v-model="dialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>{{ editing ? 'ویرایش برنامه' : 'برنامه جدید' }}</h3>
          <button class="dialog-close" @click="dialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="form-row">
            <div class="form-group">
              <label>کد برنامه <span class="req">*</span></label>
              <q-input v-model="form.code" outlined dense hide-bottom-space />
            </div>
            <div class="form-group">
              <label>هدف مرتبط <span class="req">*</span></label>
              <q-select v-model="form.target_id" outlined dense :options="targetOpts" emit-value map-options />
            </div>
          </div>
          <div class="form-group">
            <label>عنوان برنامه <span class="req">*</span></label>
            <q-input v-model="form.title" outlined dense hide-bottom-space />
          </div>
          <div class="form-group">
            <label>توضیحات</label>
            <q-input v-model="form.description" outlined dense type="textarea" rows="3" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>درصد پیشرفت</label>
              <q-input
                v-model="form.progress"
                outlined dense
                type="number"
                min="0"
                max="100"
                step="5"
                hint="مقدار بین 0 تا 100"
              />
            </div>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="انصراف" @click="dialog=false" />
          <q-btn unelevated color="primary" :label="editing ? 'ذخیره' : 'ایجاد'" @click="save" :loading="saving" />
        </div>
      </div>
    </q-dialog>

    <!-- دیالوگ اقدامات -->
    <q-dialog v-model="tasksDialog" persistent>
      <div class="form-dialog">
        <div class="dialog-head">
          <h3>اقدامات برنامه: {{ selectedProgram?.title }}</h3>
          <button class="dialog-close" @click="tasksDialog=false"><q-icon name="close" size="20px" /></button>
        </div>
        <div class="dialog-body">
          <div class="sub-list" v-if="programTasks.length > 0">
            <div class="sub-item" v-for="t in programTasks" :key="t.id">
              <div class="sub-icon sub-icon--blue"><q-icon name="checklist_rtl" size="16px" /></div>
              <div class="sub-info">
                <span class="sub-name">{{ t.title }}</span>
                <span class="sub-meta">{{ t.responsible || 'بدون مجری' }}</span>
              </div>
              <div class="prog-wrap" style="min-width:100px">
                <div class="prog-track"><div class="prog-fill" :style="{ width: (t.progress || 0) + '%' }"></div></div>
                <span class="prog-text">{{ t.progress || 0 }}%</span>
              </div>
            </div>
          </div>
          <div v-else class="empty-tasks">
            <q-icon name="info" size="32px" color="grey-4" />
            <p>اقدامی برای این برنامه تعریف نشده است</p>
          </div>
        </div>
        <div class="dialog-foot">
          <q-btn flat label="بستن" @click="tasksDialog=false" />
        </div>
      </div>
    </q-dialog>

  </div>
</template>

<script>
import { ref, computed, onMounted, watch } from 'vue'
import { useQuasar } from 'quasar'
import { api } from 'src/boot/axios'
import PageHeader from 'components/PageHeader.vue'
import SortableTable from 'components/SortableTable.vue'

export default {
  components: { PageHeader, SortableTable },
  setup () {
    const $q = useQuasar()
    const search = ref('')
    const targetFilter = ref(null)
    const dialog = ref(false)
    const tasksDialog = ref(false)
    const editing = ref(null)
    const selectedProgram = ref(null)
    const loading = ref(false)
    const saving = ref(false)
    const rows = ref([])
    const targetOpts = ref([])
    const programTasks = ref([])

    // Pagination state
    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0
    })

    const columns = [
      { key: 'index', label: '#', sortable: false },
      { key: 'code', label: 'کد', sortable: true },
      { key: 'title', label: 'عنوان برنامه', sortable: true },
      { key: 'target', label: 'هدف مرتبط', sortable: true },
      { key: 'progress', label: 'پیشرفت', sortable: true },
      { key: 'tasks_count', label: 'اقدامات', sortable: true },
      { key: 'actions', label: 'عملیات', sortable: false },
    ]

    const emptyForm = () => ({
      code: '',
      title: '',
      target_id: null,
      description: '',
      progress: 0
    })
    const form = ref(emptyForm())

    // ============================================================
    // دریافت لیست اهداف از API
    // ============================================================
    const fetchTargets = async () => {
      try {
        const response = await api.get('/targets?per_page=100')
        if (response.data.success) {
          targetOpts.value = response.data.data.map(target => ({
            label: `${target.code}: ${target.title}`,
            value: target.id
          }))
        }
      } catch (error) {
        console.error('Fetch targets error:', error)
      }
    }

    // ============================================================
    // دریافت لیست برنامه‌ها از API با صفحه‌بندی
    // ============================================================
    const fetchPrograms = async () => {
      loading.value = true
      try {
        let url = `/programs?page=${pagination.value.current_page}&per_page=${pagination.value.per_page}`

        if (search.value) {
          url += `&search=${encodeURIComponent(search.value)}`
        }
        if (targetFilter.value) {
          url += `&target_id=${targetFilter.value.value}`
        }

        const response = await api.get(url)

        if (response.data.success) {
          rows.value = response.data.data
          pagination.value = {
            current_page: response.data.pagination.current_page,
            last_page: response.data.pagination.last_page,
            per_page: response.data.pagination.per_page,
            total: response.data.pagination.total
          }
        } else {
          $q.notify({
            type: 'negative',
            message: response.data.message || 'خطا در دریافت برنامه‌ها',
            position: 'top'
          })
        }
      } catch (error) {
        console.error('Fetch programs error:', error)
        $q.notify({
          type: 'negative',
          message: error.response?.data?.message || 'خطا در ارتباط با سرور',
          position: 'top'
        })
      } finally {
        loading.value = false
      }
    }

    // ============================================================
    // دریافت اقدامات یک برنامه
    // ============================================================
    const fetchProgramTasks = async (programId) => {
      try {
        const response = await api.get(`/programs/${programId}`)
        if (response.data.success) {
          programTasks.value = response.data.data.tasks || []
        }
      } catch (error) {
        console.error('Fetch program tasks error:', error)
        programTasks.value = []
      }
    }

    // ============================================================
    // رفتن به صفحه مشخص
    // ============================================================
    const goToPage = (page) => {
      pagination.value.current_page = page
      fetchPrograms()
    }

    // ============================================================
    // جستجو
    // ============================================================
    const handleSearch = () => {
      pagination.value.current_page = 1
      fetchPrograms()
    }

    // ============================================================
    // فیلتر بر اساس هدف
    // ============================================================
    const handleTargetFilter = () => {
      pagination.value.current_page = 1
      fetchPrograms()
    }

    // ============================================================
    // باز کردن دیالوگ (ایجاد یا ویرایش)
    // ============================================================
    const openDialog = (row = null) => {
      editing.value = row
      if (row) {
        form.value = {
          code: row.code,
          title: row.title,
          target_id: row.target_id,
          description: row.description || '',
          progress: row.progress || 0
        }
      } else {
        form.value = emptyForm()
      }
      dialog.value = true
    }

    // ============================================================
    // مشاهده اقدامات برنامه
    // ============================================================
    const viewTasks = async (row) => {
      selectedProgram.value = row
      await fetchProgramTasks(row.id)
      tasksDialog.value = true
    }

    // ============================================================
    // ذخیره برنامه (ایجاد یا ویرایش)
    // ============================================================
    const save = async () => {
      if (!form.value.code || !form.value.title || !form.value.target_id) {
        $q.notify({
          type: 'negative',
          message: 'کد، عنوان و هدف الزامی هستند',
          position: 'top'
        })
        return
      }

      // تبدیل progress به عدد
      const progressValue = parseInt(form.value.progress) || 0
      if (progressValue < 0) form.value.progress = 0
      if (progressValue > 100) form.value.progress = 100

      saving.value = true

      try {
        if (editing.value) {
          // ویرایش برنامه
          const response = await api.put(`/programs/${editing.value.id}`, {
            code: form.value.code,
            title: form.value.title,
            target_id: form.value.target_id,
            description: form.value.description,
            progress: form.value.progress
          })

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'برنامه با موفقیت ویرایش شد',
              position: 'top'
            })
            await fetchPrograms()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ویرایش برنامه',
              position: 'top'
            })
          }
        } else {
          // ایجاد برنامه جدید
          const response = await api.post('/programs', {
            code: form.value.code,
            title: form.value.title,
            target_id: form.value.target_id,
            description: form.value.description,
            progress: form.value.progress
          })

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'برنامه جدید با موفقیت ایجاد شد',
              position: 'top'
            })
            await fetchPrograms()
            dialog.value = false
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در ایجاد برنامه',
              position: 'top'
            })
          }
        }
      } catch (error) {
        console.error('Save program error:', error)

        if (error.response?.status === 422 && error.response?.data?.errors) {
          const errors = error.response.data.errors
          const firstError = Object.values(errors)[0]?.[0]
          $q.notify({
            type: 'negative',
            message: firstError || 'خطا در اعتبارسنجی اطلاعات',
            position: 'top'
          })
        } else {
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در ارتباط با سرور',
            position: 'top'
          })
        }
      } finally {
        saving.value = false
      }
    }

    // ============================================================
    // حذف برنامه
    // ============================================================
    const deleteRow = (row) => {
      $q.dialog({
        title: 'حذف برنامه',
        message: `آیا از حذف "${row.title}" مطمئنید؟`,
        cancel: { label: 'انصراف', flat: true },
        ok: { label: 'حذف', color: 'negative', unelevated: true },
        persistent: true
      }).onOk(async () => {
        try {
          const response = await api.delete(`/programs/${row.id}`)

          if (response.data.success) {
            $q.notify({
              type: 'positive',
              message: 'برنامه با موفقیت حذف شد',
              position: 'top'
            })
            await fetchPrograms()
          } else {
            $q.notify({
              type: 'negative',
              message: response.data.message || 'خطا در حذف برنامه',
              position: 'top'
            })
          }
        } catch (error) {
          console.error('Delete program error:', error)
          $q.notify({
            type: 'negative',
            message: error.response?.data?.message || 'خطا در حذف برنامه',
            position: 'top'
          })
        }
      })
    }

    // ============================================================
    // بارگذاری اولیه
    // ============================================================
    onMounted(() => {
      fetchTargets()
      fetchPrograms()
    })

    return {
      search,
      targetFilter,
      dialog,
      tasksDialog,
      editing,
      selectedProgram,
      loading,
      saving,
      rows,
      form,
      targetOpts,
      programTasks,
      pagination,
      columns,
      openDialog,
      viewTasks,
      save,
      deleteRow,
      goToPage,
      handleSearch,
      handleTargetFilter
    }
  }
}
</script>

<style lang="scss" scoped>
@import './page-shared.scss';

.pagination-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  padding: 10px 0;

  .pagination-info {
    font-size: 13px;
    color: #64748b;
  }
}

.target-ref { display: flex; align-items: center; gap: 6px; }
.code-sm { font-size: 10.5px; padding: 1px 6px; }
.target-title { font-size: 12px; color: #64748b; }
.count-badge { font-size: 12px; color: #64748b; display: flex; align-items: center; }
.sub-list { display: flex; flex-direction: column; gap: 8px; }
.sub-item {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 14px; border-radius: 10px;
  background: #f8fafc; border: 1px solid #f1f5f9;
}
.sub-icon { width: 32px; height: 32px; border-radius: 8px; background: #ecfdf5; color: #1e8a5e; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.sub-icon--blue { background: #eff6ff; color: #3b82f6; }
.sub-info { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.sub-name { font-size: 13px; font-weight: 600; color: #1e293b; }
.sub-meta { font-size: 11.5px; color: #94a3b8; }
.empty-tasks {
  text-align: center;
  padding: 32px;
  color: #94a3b8;
  p { margin-top: 8px; font-size: 13px; }
}
</style>
