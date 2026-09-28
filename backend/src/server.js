import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import http from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Server } from 'socket.io';
import { v4 as uuid } from 'uuid';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
app.use(cors()); app.use(express.json());
const PORT = Number(process.env.PORT || 4000);
const SECRET = process.env.JWT_SECRET || 'local-development-secret';
const now = () => new Date().toISOString();
const users = [{ id:'u-admin', name:'System Admin', email:'admin@parking.local', role:'ADMIN', password:bcrypt.hashSync('Admin@123', 10) }, { id:'u-operator', name:'City Parking Team', email:'operator@parking.local', role:'PARKING_OPERATOR', password:bcrypt.hashSync('Operator@123', 10) }, { id:'u-driver', name:'Demo Driver', email:'driver@parking.local', role:'DRIVER', password:bcrypt.hashSync('Driver@123', 10) }];
const locations = [
	{id:'loc-hampankatta',name:'Hampankatta City Parking',address:'K S Rao Road, Hampankatta',area:'Hampankatta',latitude:12.8703,longitude:74.8431,pricePerHour:30,description:'Central covered parking near shops, offices, and the city bus stand.'},
	{id:'loc-kankanady',name:'Kankanady Junction Parking',address:'Mangaluru Bengaluru Highway, Kankanady',area:'Kankanady',latitude:12.8584,longitude:74.8551,pricePerHour:25,description:'Convenient parking near the railway station and hospital district.'},
	{id:'loc-bejai',name:'Bejai Commercial Complex',address:'Bejai Main Road',area:'Bejai',latitude:12.8913,longitude:74.8494,pricePerHour:25,description:'Secure multi-level parking for the Bejai retail and residential area.'},
	{id:'loc-kadri',name:'Kadri Park Visitor Parking',address:'Kadri Park Road',area:'Kadri',latitude:12.8847,longitude:74.8559,pricePerHour:20,description:'Short-stay parking beside Kadri Park and surrounding neighbourhoods.'},
	{id:'loc-lalbagh',name:'Lalbagh Transit Hub',address:'Lalbagh, Mangaluru',area:'Lalbagh',latitude:12.8781,longitude:74.8422,pricePerHour:25,description:'Central parking close to transit connections and commercial streets.'},
	{id:'loc-jyothi',name:'Jyothi Circle Parking',address:'Balmatta Road, Jyothi',area:'Jyothi',latitude:12.8742,longitude:74.8466,pricePerHour:30,description:'Day parking near offices, restaurants, and educational institutions.'},
	{id:'loc-panambur',name:'Panambur Beach Parking',address:'Panambur Beach Road',area:'Panambur',latitude:12.9495,longitude:74.8022,pricePerHour:20,description:'Open parking for beach visitors with evening and weekend availability.'},
	{id:'loc-surathkal',name:'Surathkal Market Parking',address:'Main Road, Surathkal',area:'Surathkal',latitude:13.0068,longitude:74.7935,pricePerHour:20,description:'Public parking near the market, university route, and NH 66.'}
];
const slots = locations.flatMap((location, index) => Array.from({length:12}, (_, i) => ({ id:`${location.id}-S${i+1}`, locationId:location.id, label:`${String.fromCharCode(65 + index)}-${String(i+1).padStart(2,'0')}`, status: i < index + 2 ? 'OCCUPIED' : 'AVAILABLE', vehicleType:'CAR' })));
const reservations = []; const traffic = [
	{area:'Hampankatta',level:'HIGH',speed:16,incidents:3}, {area:'Kankanady',level:'HIGH',speed:21,incidents:2},
	{area:'Bejai',level:'MEDIUM',speed:29,incidents:1}, {area:'Kadri',level:'MEDIUM',speed:27,incidents:1},
	{area:'Lalbagh',level:'HIGH',speed:19,incidents:2}, {area:'Jyothi Circle',level:'MEDIUM',speed:24,incidents:1},
	{area:'Panambur',level:'LOW',speed:42,incidents:0}, {area:'Surathkal',level:'MEDIUM',speed:32,incidents:1},
	{area:'Bendoorwell',level:'LOW',speed:38,incidents:0}, {area:'Nanthoor Junction',level:'HIGH',speed:14,incidents:3}
];
function auth(req,res,next){ const token=req.headers.authorization?.replace('Bearer ',''); if(!token) return res.status(401).json({message:'Authentication required'}); try{req.user=jwt.verify(token,SECRET);next()}catch{return res.status(401).json({message:'Invalid token'})} }
function roles(...allowed){return (req,res,next)=>allowed.includes(req.user.role)?next():res.status(403).json({message:'Insufficient permissions'})}
function publicUser(user){const {password,...safe}=user;return safe}
app.get('/api/health',(req,res)=>res.json({status:'ok',service:'backend',time:now(),database:'memory-fallback',redis:'graceful-fallback'}));
app.post('/api/auth/register',async(req,res)=>{const {name,email,password}=req.body||{};if(!name||!email||!password||password.length<8)return res.status(400).json({message:'Name, email and a password of 8+ characters are required'});if(users.some(u=>u.email===email.toLowerCase()))return res.status(409).json({message:'Email already registered'});const user={id:uuid(),name,email:email.toLowerCase(),role:'DRIVER',password:await bcrypt.hash(password,10)};users.push(user);res.status(201).json({user:publicUser(user),token:jwt.sign({id:user.id,email:user.email,role:user.role},SECRET,{expiresIn:'8h'})})});
app.post('/api/auth/login',async(req,res)=>{const user=users.find(u=>u.email===String(req.body?.email||'').toLowerCase());if(!user||!(await bcrypt.compare(req.body?.password||'',user.password)))return res.status(401).json({message:'Invalid email or password'});res.json({user:publicUser(user),token:jwt.sign({id:user.id,email:user.email,role:user.role},SECRET,{expiresIn:'8h'})})});
app.get('/api/auth/me',auth,(req,res)=>res.json({user:publicUser(users.find(u=>u.id===req.user.id))}));
app.get('/api/parking/locations',(req,res)=>{const q=String(req.query.q||'').toLowerCase();const result=locations.filter(x=>!q||`${x.name} ${x.area} ${x.address}`.toLowerCase().includes(q)).map(x=>({...x,available:slots.filter(s=>s.locationId===x.id&&s.status==='AVAILABLE').length,total:slots.filter(s=>s.locationId===x.id).length}));res.json({data:result,pagination:{page:1,pageSize:result.length,total:result.length}})});
app.get('/api/parking/locations/:id',(req,res)=>{const location=locations.find(x=>x.id===req.params.id);if(!location)return res.status(404).json({message:'Location not found'});res.json({...location,slots:slots.filter(s=>s.locationId===location.id)})});
app.post('/api/reservations',auth,roles('DRIVER'),(req,res)=>{const {slotId,startTime,endTime}=req.body||{};const slot=slots.find(s=>s.id===slotId);if(!slot)return res.status(404).json({message:'Slot not found'});if(slot.status!=='AVAILABLE')return res.status(409).json({message:'Slot is no longer available'});slot.status='RESERVED';const reservation={id:uuid(),userId:req.user.id,slotId,locationId:slot.locationId,startTime,endTime,status:'CONFIRMED',createdAt:now()};reservations.push(reservation);io.emit('parking:slot-updated',{slotId,status:slot.status});res.status(201).json(reservation)});
app.get('/api/reservations',auth,(req,res)=>res.json(reservations.filter(x=>req.user.role!=='DRIVER'||x.userId===req.user.id).map(x=>({...x,location:locations.find(l=>l.id===x.locationId),slot:slots.find(s=>s.id===x.slotId)}))));
app.patch('/api/reservations/:id/cancel',auth,(req,res)=>{const r=reservations.find(x=>x.id===req.params.id&& (req.user.role!=='DRIVER'||x.userId===req.user.id));if(!r)return res.status(404).json({message:'Reservation not found'});if(r.status==='CANCELLED')return res.status(400).json({message:'Reservation already cancelled'});r.status='CANCELLED';const slot=slots.find(s=>s.id===r.slotId);if(slot)slot.status='AVAILABLE';io.emit('parking:slot-updated',{slotId:r.slotId,status:'AVAILABLE'});res.json(r)});
app.get('/api/traffic',(req,res)=>res.json({simulated:true,city:'Mangaluru',updatedAt:now(),data:traffic}));
app.get('/api/analytics/summary',auth,roles('ADMIN','PARKING_OPERATOR'),(req,res)=>res.json({users:users.length,locations:locations.length,slots:slots.length,available:slots.filter(s=>s.status==='AVAILABLE').length,reservations:reservations.length,occupancy:Math.round(slots.filter(s=>s.status!=='AVAILABLE').length/slots.length*100)}));
app.patch('/api/parking/slots/:id',auth,roles('ADMIN','PARKING_OPERATOR'),(req,res)=>{const slot=slots.find(s=>s.id===req.params.id);if(!slot)return res.status(404).json({message:'Slot not found'});if(slot.status==='RESERVED')return res.status(409).json({message:'Reserved slots cannot be manually changed'});slot.status=req.body.status==='MAINTENANCE'?'MAINTENANCE':'AVAILABLE';io.emit('parking:slot-updated',{slotId:slot.id,status:slot.status});res.json(slot)});
app.get('/api/ai/predictions',async(req,res)=>{try{const response=await fetch(`${process.env.AI_SERVICE_URL||'http://localhost:8000'}/predict/parking`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({location_id:req.query.locationId||'loc-central',hour:Number(req.query.hour||12),day_of_week:new Date().getDay(),capacity:12})});res.json(await response.json())}catch{res.json({source:'fallback',prediction:'AI service unavailable',estimated_occupancy:65,estimated_available:4})}});
app.use((err,req,res,next)=>res.status(500).json({message:'Unexpected server error'}));
server.listen(PORT,()=>console.log(`Backend listening on http://localhost:${PORT}`));
export {app,server,users,locations,slots,reservations};
