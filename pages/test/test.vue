<template>
	<view class="page">
		<view class="pic">
			<image class="headPic" src="/static/hk.jpg" mode="aspectFill"></image>
		</view>
		<view class="content">
			<view class="inputBox">
				<view class="item line">
					<image class="icon" src="/static/login.png" mode=""></image>
					<input type="text" v-model="from.user" placeholder="请输入用户名"/>
				</view>
				<view class="item">
					<image class="icon" src = "/static/lock.png"></image>
					<input type="text" v-model="from.pwd" placeholder="请输入密码"/>
				</view>
			</view>
		</view>
		<view class="btnBox">
			<button @click="login" class="btn" type="primary">登陆</button>
		</view>
	</view>
</template>

<script>
import uniBadge from '@/components/uni-badge/uni-badge.vue'
import cityData from '../../../common/city.data.js';
import http from 'axios';
	export default {
		data() {
			return {
				from:{
					user:"",
					pwd:""
				}
			}
		},
		methods: {
			login:async function(){
				console.log("登陆")
				console.log("from",this.from)
				const res = await this.$post({
					url:"http://zhike-test2.vanke.com/api/login",
					data:{
						mobile:this.from.user,
						pwd:this.from.pwd,
						rand:"44957512029167090802806074434742",
						captcha:""
					}
				})
				console.log("res:",res)
			}
		}
	}
</script>

<style scoped>
    @import "./editor-icon.css";
	page {
			display: flex;
			flex-direction: column;
			box-sizing: border-box;
			background-color: #fff;
	}
	.backTest{
		background-image:url('/static/api.png');
	}
	.backTest2{
		background-image: url ('/static/ap222i.png');
	}
	.pic{
		display: flex;
		justify-content: center;
		margin-top: 120rpx;
	}
	.headPic{
		height: 180rpx;
		width: 180rpx;
		border-radius: 50%;
	}
	.content{
		display: flex;
		justify-content: center;
	}
	.inputBox{
		margin-top: 80rpx;
		width: 600rpx;
		height: 150rpx;
		border: 1rpx solid #aaa;
		border-radius: 8rpx;
	}
	.item{
		height: 75rpx;
		display: flex;
		flex-wrap: nowrap;
		align-items: center;
	}
	.icon{
		width: 50rpx;
		height: 50rpx;
		margin: 0 10rpx 0 10rpx;
	}
	.line{
		border-bottom: 1px solid #aaa;
	}
	.btnBox{
		display: flex;
		justify-content:center;
		margin-top: 36rpx;
	}
	.btn{
		width: 600rpx;
	}
</style>
