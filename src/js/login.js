import { createApp } from 'https://cdnjs.cloudflare.com/ajax/libs/vue/3.0.9/vue.esm-browser.js';

const app = createApp({
    data() {
        return {
            username: '',
            password: '',
            apiUrl: 'https://vue3-course-api.hexschool.io/v2',
            path: 'ginjack',
            is_err: 0,
            veeFail: {
                email: 0,
                password: 0
            }
        }
    },
    methods: {
        postSignIn() {
            if (this.veeFail.email === 0 && this.veeFail.password === 0 && this.username !== '' && this.password !== '') {
                const username = this.username;
                const password = this.password;
                const user = {
                    username,
                    password
                }
                axios.post(`${this.apiUrl}/admin/signin`, user)
                    .then((res) => {
                        const { token, expired } = res.data;
                        document.cookie = `hexToken=${token}; expires=${new Date(expired)}`;
                        document.location = `./products.html`;
                    })
                    .catch((err) => {
                        alert('帳號或密碼錯誤！');
                        this.is_err = 1;
                    })
            }else{
                alert('確認資料是否填寫正確');
            }
        },
        checkEmail() {
            const regBatch = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
            if (regBatch.test(this.username)) {
                this.veeFail.email = 0;
            } else {
                this.veeFail.email = 1;
            }
        }
    }
})




app.mount('#app');