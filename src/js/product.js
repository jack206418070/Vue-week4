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
            axios.post(`${this.apiUrl}/api/${this.path}/admin/product`, data)
                .then((res) => {
                    if (res.data.success) {
                        this.$emit('getProducts');
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
                eval: 1
            };
        } else if (this.modaltype.is_edit) {
            this.modalTitle = '編輯產品';
            this.tempProduct = JSON.parse(JSON.stringify(this.product));
        } else if (this.modaltype.is_delete) {
            this.modalTitle = '刪除產品';
            this.tempProduct = JSON.parse(JSON.stringify(this.product));
        }
    },
    template: '#productModal'
})

app.component('pagination', {
    props: ['pagination'],
    emits: ['getProduct'],
    data() {
        return {

        }
    },
    template: '#pagination'
})

app.mount('#app');
