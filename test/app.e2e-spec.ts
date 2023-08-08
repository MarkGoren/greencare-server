import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppTestModule } from './../src/app.module.test';
import * as testData from './testData.json';
import * as cookieParser from 'cookie-parser';
import * as bodyParser from 'body-parser';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let agent: request.SuperTest<request.Test>;

  beforeAll(async () => {
    jest.setTimeout(10000);
  });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppTestModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    await app.init();
    agent = request(app.getHttpServer());
  });

  afterEach(async () => {
    await app.close();
  });

  const accessToken = { access_token: '' };

  it('/ (GET)', () => {
    return agent.get('/').expect(200).expect('Hello World!');
  });

  it('should make user1 add a new location', () => {
    if (!testData) {
      throw new Error('testData is not loaded properly');
    }

    accessToken.access_token = testData?.user1Token;
    return agent
      .post('/gatherings/createNew')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(JSON.stringify(testData.testLocationData))
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"location added successfully!"');
  });

  let locationId = '';

  it('should get the id of the location found by user1', () => {
    return agent
      .get('/gatherings/getAll/locations')
      .then((data) => (locationId = data.body[0]._id));
  });

  const date = new Date();

  it('should make user2 start a gathering from user1`s location', () => {
    accessToken.access_token = testData?.user2Token;
    return agent
      .post('/gatherings/addUser')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          gatheringId: locationId,
          time: date.setDate(date.getDate() + 10),
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"user added to gathering successfully!"');
  });

  let gatheringId = '';

  it('should get the id of the gathering init by user2', () => {
    return agent
      .get('/gatherings/getAll/gatherings')
      .then((data) => (gatheringId = data.body[0]._id));
  });

  it('should make user1 join user2`s gathering', () => {
    accessToken.access_token = testData?.user1Token;
    return agent
      .post('/gatherings/addUser')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          gatheringId: locationId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"user added to gathering successfully!"');
  });

  it('should make user3 join user2`s gathering', () => {
    accessToken.access_token = testData?.user3Token;
    return agent
      .post('/gatherings/addUser')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          gatheringId: locationId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"user added to gathering successfully!"');
  });

  it('should make user2 leave the gathering', () => {
    accessToken.access_token = testData?.user2Token;
    return agent
      .post('/gatherings/removeUser')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          gatheringId: locationId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"user removed successfully!"');
  });

  it('should approve user1 location', () => {
    accessToken.access_token = testData?.user1Token;
    return agent
      .post('/gatherings/approveUserLocation')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          gatheringId: gatheringId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"users location approved!"');
  });

  it('should approve user3 location', () => {
    accessToken.access_token = testData?.user3Token;
    return agent
      .post('/gatherings/approveUserLocation')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          gatheringId: gatheringId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"users location approved!"');
  });

  it('should close the gathering by user1', () => {
    accessToken.access_token = testData?.user1Token;
    return agent
      .post('/gatherings/closeGathering')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          gatheringId: locationId,
          imgsAfter: ['test', 'test', 'test'],
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"gathering closed successfully!"');
  });

  it('should approve the gathering by an admin', () => {
    accessToken.access_token = testData?.adminToken;
    return agent
      .post('/gatherings/updateGatheringStatus/approved')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          gatheringId: gatheringId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"status updated successfully!"');
  });

  it('should make user1 buy a prize', () => {
    accessToken.access_token = testData?.user1Token;
    return agent
      .post('/prizes/buyPrize')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          hashedPrizeId: testData.hashedPrizeId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"prize purchased successfully!"');
  });

  it('should make user3 buy a prize', () => {
    accessToken.access_token = testData?.user3Token;
    return agent
      .post('/prizes/buyPrize')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          hashedPrizeId: testData.hashedPrizeId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect(200)
      .expect('"prize purchased successfully!"');
  });

  it('should make user2 buy a prize', () => {
    accessToken.access_token = testData?.user2Token;
    return agent
      .post('/prizes/buyPrize')
      .set('Cookie', `jwtToken=${JSON.stringify(accessToken)}`)
      .send(
        JSON.stringify({
          hashedPrizeId: testData.hashedPrizeId,
        }),
      )
      .set('Content-Type', 'application/json')
      .set('Accept', 'application/json')
      .expect((res) => {
        return (
          res.body.statusCode !== 400 &&
          res.body.message !== 'not enough coins to complete purchase!'
        );
      });
  });
});
