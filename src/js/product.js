import { createApp } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.0.9/vue.esm-browser.js';

const app = createApp({
    data() {
        return {
            apiUrl: 'https://vue3-course-api.hexschool.io/v2',
            path: 'ginjack',
            searchText: '',
            categoryArr: ['蔬果', '海鮮', '肉品'],
            modalControl: {
                is_add: false,
                is_edit: false,
                is_sideMenu: true,
                is_delete: false
            },
            is_loading: false,
            ascending: false,
            sideToggle: true,
            products: [],
            tempProducts: null,
            pagination: {},
            editTempProduct: {
                imagesUrl: []
            }
        }
    },
    methods: {
        checkLogin() {
            this.is_loading = true;
            axios.post(`${this.apiUrl}/api/user/check`)
                .then((res) => {
                    if (res.data.success) this.getProducts();
                })
                .catch((err) => {
                    alert('驗證碼失效或者錯誤');
                    document.location = `./index.html`;
                })
        },
        logout() {
            axios.post(`${this.apiUrl}/logout`)
                .then(res => {
                    alert('登出成功');
                    document.location = `./index.html`;
                })
                .catch(err => {
                    console.log(err);
                })
        },
        getProducts(page = 1) {
            this.is_loading = true;
            this.tempProducts = null;
            this.searchText = '';
            axios.get(`${this.apiUrl}/api/${this.path}/admin/products?page=${page}`)
                .then((res) => {
                    if (res.data.success) {
                        this.products = res.data.products;
                        this.pagination = res.data.pagination;
                        this.is_loading = false;
                    }
                })
                .catch((err) => {
                    console.dir(err);
                })
        },
        clearProduct(type) {
            this.tempProduct = { is_enabled: 0 }
            type === 'add' ? this.is_add = false : this.is_edit = false;
        },
        closeModal() {
            this.modalControl.is_add = false;
            this.modalControl.is_edit = false;
            this.modalControl.is_delete = false;
        },
        loadingHandler() {
            this.is_loading = !this.is_loading;
        },
        editProduct(id) {
            this.is_loading = true;
            this.editTempProduct.is_enabled = !this.editTempProduct.is_enabled;
            const data = { data: { ...this.editTempProduct } }
            this.modalControl.is_add = false;
            axios.put(`${this.apiUrl}/api/${this.path}/admin/product/${id}`, data)
                .then((res) => {
                    if (res.data.success) {
                        this.getProducts();
                        this.editTempProduct = {};
                    }
                })
                .catch(err => {
                    console.dir(err);
                })
        },
        searchHandler() {
            if (this.searchText === '') {
                this.getProducts();
            }
            let tempData = [];
            this.products.forEach(product => {
                if (product.title.match(this.searchText)) {
                    tempData.push(product);
                }
            })
            this.products = tempData;
        }
    },
    computed: {
        filterProducts: {
            get() {
                return this.tempProducts || this.products;
            },
            set(val) {
                if (val === 'search') {
                    this.tempProducts = [];
                    this.products.forEach(product => {
                        if (product.title.match(this.searchText)) {
                            this.tempProducts.push(product);
                        }
                    })
                    return this.tempProducts;
                } else if (val === 'price') {
                    this.tempProducts = this.tempProducts || JSON.parse(JSON.stringify(this.products));
                    this.tempProducts.sort((a, b) => this.ascending ? a.price - b.price : b.price - a.price);
                    return this.tempProducts;
                }
            }
        },
    },
    mounted() {
        const token = document.cookie.replace(/(?:(?:^|.*;\s*)hexToken\s*\=\s*([^;]*).*$)|^.*$/, "$1");
        axios.defaults.headers.common['Authorization'] = token;
        this.checkLogin();
    }
})


app.component('modal', {
    emits: ['close-modal', 'loading', 'getProducts'],
    props: ['modaltype', 'product', 'category'],
    data() {
        return {
            modalTitle: '',
            tempProduct: {},
            apiUrl: 'https://vue3-course-api.hexschool.io/v2',
            path: 'ginjack',
        }
    },
    methods: {
        upload(type) {
            let fileInput;
            if (type === "mult") {
                fileInput = document.querySelector('#file2')
            } else {
                fileInput = document.querySelector('#file');
            }
            const file = fileInput.files[0];
            const formData = new FormData();
            formData.append('file-to-upload', file);
            this.$emit('loading');
            axios.post(`${this.apiUrl}/api/${this.path}/admin/upload`, formData)
                .then((res) => {
                    if (res.data.success) {
                        if (type === 'single') {
                            this.tempProduct.imageUrl = res.data.imageUrl;
                        } else {
                            this.tempProduct.imagesUrl != [] ? this.tempProduct.imagesUrl = [] : this.tempProduct;
                            this.tempProduct.imagesUrl.push(res.data.imageUrl);
                        }
                        this.$emit('loading');
                    }
                })
                .catch(err => {
                    console.log(this.tempProduct)
                    console.dir(err);
                })
        },
        editProduct(id) {
            this.$emit('loading');
            const data = { data: { ...this.tempProduct } }
            this.$emit('close-modal');
            axios.put(`${this.apiUrl}/api/${this.path}/admin/product/${id}`, data)
                .then((res) => {
                    if (res.data.success) {
                        this.$emit('getProducts');
                        this.tempProduct = {};
                    }
                })
                .catch(err => {
                    console.dir(err);
                })
        },
        addProduct() {
            this.$emit('close-modal');
            this.$emit('loading');
            const data = { data: { ...this.tempProduct } };
            console.log(this.tempProduct);
            axios.post(`${this.apiUrl}/api/${this.path}/admin/product`, data)
                .then((res) => {
                    if (res.data.success) {
                        this.$emit('getProducts');
                        this.tempProduct = {};
                    }
                })
                .catch((err) => {
                    console.log(err.response);
                })
        },
        deleteProduct(id) {
            this.$emit('loading');
            this.$emit('close-modal');
            axios.delete(`${this.apiUrl}/api/${this.path}/admin/product/${id}`)
                .then((res) => {
                    if (res.data.success) {
                        this.$emit('getProducts');
                        this.tempProduct = {};
                    }
                })
                .catch((err) => {
                    console.log(err.response);
                })
        },
    },
    created() {
        if (this.modaltype.is_add) {
            this.modalTitle = '新增產品';
            this.tempProduct = {
                imagesUrl: [],
                is_enabled: 0,
                eval: 0
            };
        } else if (this.modaltype.is_edit) {
            this.modalTitle = '編輯產品';
            this.tempProduct = JSON.parse(JSON.stringify(this.product));
        } else if (this.modaltype.is_delete) {
            this.modalTitle = '刪除產品';
            this.tempProduct = JSON.parse(JSON.stringify(this.product));
        }
    },
    template: `
    <div class="productModal">
    <h2>{{ modalTitle }}</h2>
    <div v-if=" modaltype.is_delete === true " class="delete__content">
        <p>確定要刪除 {{ tempProduct.title }} 嗎？</p>
    </div>
    <form v-else action="#">
        <div class="form-group">
            <div class="form-control w-50">
                <label for="title">產品名稱</label>
                <input id="title" class="w-100" type="text" v-model="tempProduct.title">
            </div>
            <div class="form-control w-50">
                <label for="category">產品分類</label>
                <select id="category" v-model="tempProduct.category">
                    <option value="" disabled>請選擇一個分類</option>
                    <template v-for="item in category" :key="item">
                        <option :value="item" >{{ item }}</option>
                    </template>
                </select>
            </div>
        </div>
        <div class="form-group">
            <div class="form-control w-50">
                <label for="originPrice">原始價格</label>
                <input id="originPrice" type="number" min=0 v-model.number="tempProduct.origin_price">
            </div>
            <div class="form-control w-50">
                <label for="price">販售價格</label>
                <input id="price" type="number" min=0 v-model.number="tempProduct.price">
            </div>
        </div>
        <div class="form-group">
            <div class="form-control w-50">
                <div class="input-checkbox">
                    <p class="mb-2">是否啟用</p>
                    <div class="toggle" @click="tempProduct.is_enabled == 0 ? tempProduct.is_enabled = 1 : tempProduct.is_enabled = 0" :class="{'active': tempProduct.is_enabled == 1}">
                    </div>
                </div>
            </div>
            <div class="form-control w-50">
                <label for="unit">單位</label>
                <input class="w-100"  type="text" name="unit" id="unit" v-model="tempProduct.unit">
            </div>
        </div>
        <div class="form-control">
            <label for="content">產品內容</label>
            <input type="text" id="content" v-model="tempProduct.content">
        </div>
        <div class="form-control">
            <label for="desc">產品描述</label>
            <textarea name="desc" id="desc" cols="30" rows="10" v-model="tempProduct.description"></textarea>
        </div>
        <div class="form-control eval">
            <h3 class="mb-1">產品評價</h3>
            <ul class="d-flex">
                <li class="me-1">
                    <a herf="#"><i class="far fa-star" @click="tempProduct.eval = 1" :class="{'active': tempProduct.eval > 0}"></i></a>
                </li>
                <li class="me-1">
                    <a herf="#"><i class="far fa-star" @click="tempProduct.eval = 2" :class="{'active': tempProduct.eval > 1}"></i></a>
                 </li>
                <li class="me-1">
                    <a herf="#"><i class="far fa-star" @click="tempProduct.eval = 3" :class="{'active': tempProduct.eval > 2}"></i></a>
                </li>
                <li class="me-1">
                    <a herf="#"><i class="far fa-star" @click="tempProduct.eval = 4" :class="{'active': tempProduct.eval > 3}"></i></a>
                </li>
                <li>
                    <a herf="#"><i class="far fa-star" @click="tempProduct.eval = 5" :class="{'active': tempProduct.eval > 4}"></i></a>
                </li>
            </ul>
        </div>
        <div class="form-control">
            <label for="file">封面圖片</label>
            <input @change="upload('single')" type="file" class="bg--white" id="file" name="filename"  placeholder="請輸入圖片連結" >
            <template v-if="tempProduct.imageUrl">
                <div class="file__img mt-2">
                        <div class="file__img__del" @click="tempProduct.imageUrl = '' ">刪除</div>
                        <img style="height: 80px" :src="tempProduct.imageUrl">
                </div>
            </template>
        </div>
        <div class="form-control">
                <label for="file">多層圖片</label>
                <input @change="upload('mult')" type="file" class="bg--white" id="file2" name="filename"  placeholder="請輸入圖片連結">
                <template v-if="tempProduct.imagesUrl">
                    <div class="file__img me-2 mt-2" v-for="image in tempProduct.imagesUrl" :key="image">
                        <div class="file__img__del" @click="tempProduct.imagesUrl.splice(key, 1)">刪除</div>
                        <img style="height: 80px;" :src="image" >   
                    </div>
                </template>
        </div>
    </form>
    <div class="btn-group bg--dark--secondary">
        <a @click.prevent="$emit('close-modal')"  class="btn btn--danger" href="#">取消</a>
        <a v-if="modalTitle === '新增產品'" @click.prevent="addProduct"  class="btn btn--success" href="#">新增產品</a>
        <a v-else-if="modalTitle === '編輯產品'" @click.prevent="editProduct(tempProduct.id)"  class="btn btn--success" href="#">修改產品</a>
        <a v-else="modalTitle === '刪除產品'" @click.prevent="deleteProduct(tempProduct.id)"  class="btn btn--danger" href="#">刪除產品</a>
    </div>
</div>
    `
})

app.component('pagination', {
    props: ['pagination'],
    emits: ['getProduct'],
    data() {
        return {

        }
    },
    template: `
    <ul class="pagination d-flex align-items-center jy-content-center">
        <li v-show="pagination.has_pre" class="pagination__prev" @click="$emit('getProduct',pagination.current_page - 1)"><span><i class="fas fa-chevron-left"></i>Prev</span></li>
        <li class="pagination__item" 
            v-for="page in pagination.total_pages" 
            :key="page"
            :class="{'active': page === pagination.current_page}"
            @click="$emit('getProduct',page)">
            <span>{{ page }}</span>
        </li>
        <li v-show="pagination.has_next" class="pagination__next" @click="$emit('getProduct',pagination.current_page + 1)"> <span>Next<i class="fas fa-chevron-right"></i></span></li>
    </ul>
    
    `
})

app.mount('#app');
