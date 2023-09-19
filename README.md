# Bank API
**เครื่องมือที่ใช้**
- Node.js (LTS) v. 18.17
	- `npm i` (ติดตั้ง package ทั้งหมด)
	- `npm run dev-prisma`
	- Global dependencies (Install command)
		- pm2 `npm install pm2 -g`
	- สร้าง .env ไฟล์ไว้ที่โฟล์เดอร์แรก (ที่มี index.js อยู่) และใส่
		 `DATABASE_URL_GATEWAY="mysql://root:@Egat2020@43.229.79.117:3307/api"`
- PHP v. 7.4
- Redis ล่าสุด

# ขั้นตอนการติดตั้ง Redis
- ติดตั้ง Docker 
- ทำการดึงอิมเมจของ Redis (ล่าสุด) ด้วย `docker pull redis`
- ทำการสร้าง Container ของ redis

	`docker run --name redis -d -p 6379:6379 -e REDIS_PASSWORD=Fs#5132Xcza redis`
	- หรือสามารถกำหนดรหัสผ่านได้ที่ REDIS_PASSWORD= . . .
- สามารถเช็คผลลัพท์ได้ด้วยการ `docker container ls --all` จะได้
![alt text](https://i.imgur.com/leMADya.png)
- โดยให้สังเกต "CONTAINER ID" ให้จำ 3 หลักแรกของอิมเมจ redis ไว้เช่นดังรูปคือ "f9a"
- ขั้นตอนต่อไปคือการเข้าไปใน Service ของ Redis โดยให้ใส่ id ก่อนหน้านี้หลัง -it 

	`docker exec -it f9a redis-cli` 
- จะเข้าสู่ Service ของ Redis ![alt text](https://i.imgur.com/WF7hv1a.png)
- จากนั้นจะต้องเซ็ทรหัสผ่านใน Service อีกครั้งด้วย `CONFIG SET requirepass "Fs#5132Xcza"` หรือใส่หรัสผ่านตามที่ต้องการ ถ้าสำเร็จจะขึ้น OK
- ทำการเช็คการตั้งค่ารหัสผ่าน `AUTH Fs#5132Xcza` ถ้าสำเร็จจะขึ้น OK

**เสร็จสิ้น**
  
![alt text](https://i.imgur.com/m1lYLMf.png)
