/**
* @file index.js
* @author Tony Ngan
* @desc mocha test for Utility and SamlLib module
*/
// Package
var Utility = require('../lib/Utility');
var should = require('should');
var fs = require('fs');
var SamlLib = require('../lib/SamlLib');
var xpath = require('xpath');
var dom = require('xmldom').DOMParser;
var binding = require('../lib/urn').namespace.binding;
var select = require('xml-crypto').xpath;

// Define of metadata
var _spKeyFolder = './test/key/sp/';
var _spPrivPem = _spKeyFolder + 'privkey.pem';
var _spPrivKey = _spKeyFolder + 'nocrypt.pem';
var _spPrivKeyPass = 'VHOSp5RUiBcrsjrcAuXFwU1NKCkGA8px';

// Define metadata
var IdPMetadata = require('../lib/IdPMetadata')('./test/metadata/IDPMetadata.xml');
var SPMetadata = require('../lib/SPMetadata')('./test/metadata/SPMetadata.xml');
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
function writer(str){
    fs.writeFileSync('test.txt',str);
}
*/
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('1. Utility.js', function() {
    it('1.1 Base64 Encoding should return encoded string', function(done) {
        (Utility.base64Encode('Hello World')).should.be.equal('SGVsbG8gV29ybGQ=');
        done();
    });
    it('1.2 Base64 Decoding should return desendLoginResponsecoded string', function(done) {
        (Utility.base64Decode('SGVsbG8gV29ybGQ=')).should.be.equal('Hello World');
        done();
    });
    it('1.3 SAML Encoded (Deflate + Base64 Encoded)', function(done) {
        (Utility.base64Encode(Utility.deflateString('Hello World'))).should.be.equal('80jNyclXCM8vykkBAA==');
        done();
    });
    it('1.4 SAML Decoded (Base64 Decoded + Inflate)', function(done) {
        (Utility.inflateString('80jNyclXCM8vykkBAA==')).should.be.equal('Hello World');
        done();
    });
    it('1.5 Check item whether it is true', function(done) {
        (Utility.isTrue('true').should.be.equal(true));
        (Utility.isTrue('false').should.be.equal(false));
        (Utility.isTrue(true).should.be.equal(true));
        (Utility.isTrue(undefined).should.be.equal(false));
        done();
    });
});

describe('2. SamlLib.js', function() {
    var _originRequest = fs.readFileSync('./test/metadata/SAMLRequest.xml').toString();
    var _decodedResponse = fs.readFileSync('./test/metadata/SignSAMLResponse.xml').toString();
    var _decodedResponseDoc = new dom().parseFromString(_decodedResponse);
    var _decodedResponseSignature = select(_decodedResponseDoc, "/*/*[local-name(.)='Signature']")[0];
    var octetString = 'SAMLRequest=fVNdj9MwEHxH4j9Yfm%2Fi5PpBrLaotEJUOrioKTzwgoy9oZZiO9ibu%2FLvcXLtKUhHnyzZM7Mzu+tlEKZp+abDkz3A7w4CkrNpbODDw4p23nIngg7cCgOBo+TV5vM9zxPGW+%2FQSdfQEeU2Q4QAHrWzlOx3K%2FrjHSsWbFEzdsfETDE2z5ksVKHqYlHP84WooVBS5lNKvoEPkbeiUYaS0rtHrcB%2FiRVWtCoJRuNRM4QO9jagsBiRLJtO2GKSzY%2F5HZ%2FlfDr7TskuIrUVOIidEFueplq1CZyFaRtIpDNpVT1U4B+1hKQ9tUO5IegHbZW2v25n%2FPkMCvzT8VhOyofqSMnmmnvrbOgM+Iv818P9i4nwrwcFxmVp1IJzb+K9kIGu374hZNm3mQ9R%2Ffp1rgEUSqBYpmPsC7nlfd%2F2u9I1Wv4hH503Av8fKkuy4UarST1AORihm41SHkKI4ZrGPW09CIyzQN8BTce1LmsFaliy2ACEM5KtM63wOvRTiNYlPoe7xhtjt01cmwPU65ubJbnscfG6jMeT8+qS%2FlWpwV96w2BEXN%2FHn2P9Fw%3D%3D&SigAlg=http%3A%2F%2Fwww.w3.org%2F2000%2F09%2Fxmldsig%23rsa-sha1';
    var signatureB64 = 'kHxN/zU3K3gVaeOdSXMu0d8PFXGTuA3QdmFgE9rOldnNjbdeNoIJj+nsUeghPFu3+Mahu9Ld7P1jm+/hC+j4fhLNQ/r3c+/VN8MZW2vA059HhZa4XhhhFgFdZHkBCfnezpy6tjONkxwsHYRoN8jahcvh5IfKwxnIrdzQPTDOGNEOALVvBbEg73hT8wDnFNdYBtHzUmAmUelwN6f+9dZ/W6EozIip4X6J7HczhXo/pnCmZEKk9agLsHfMgbeczQb82XgpClUwnJjoKPNzBwwMqtTkToDGWakAmZxg+CLu7UlbbIsLPVLavgOyusq6orSeSZ9eZMGfi8brqdHFnMFZgA==';
    var dummySignRequest = 'PHNhbWxwOkF1dGhuUmVxdWVzdCB4bWxuczpzYW1scD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6Mi4wOnByb3RvY29sIiB4bWxuczpzYW1sPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6YXNzZXJ0aW9uIiBJRD0iXzgwOTcwN2YwMDMwYTVkMDA2MjBjOWQ5ZGY5N2Y2MjdhZmU5ZGNjMjQiIFZlcnNpb249IjIuMCIgUHJvdmlkZXJOYW1lPSJTUCB0ZXN0IiBJc3N1ZUluc3RhbnQ9IjIwMTQtMDctMTZUMjM6NTI6NDVaIiBEZXN0aW5hdGlvbj0iaHR0cDovL2lkcC5leGFtcGxlLmNvbS9TU09TZXJ2aWNlLnBocCIgUHJvdG9jb2xCaW5kaW5nPSJ1cm46b2FzaXM6bmFtZXM6dGM6U0FNTDoyLjA6YmluZGluZ3M6SFRUUC1QT1NUIiBBc3NlcnRpb25Db25zdW1lclNlcnZpY2VVUkw9Imh0dHBzOi8vc3AuZXhhbXBsZS5vcmcvc3Avc3NvIj48c2FtbDpJc3N1ZXIgSWQ9Il8wIj5odHRwczovL3NwLmV4YW1wbGUub3JnL21ldGFkYXRhPC9zYW1sOklzc3Vlcj48c2FtbHA6TmFtZUlEUG9saWN5IEZvcm1hdD0idXJuOm9hc2lzOm5hbWVzOnRjOlNBTUw6MS4xOm5hbWVpZC1mb3JtYXQ6ZW1haWxBZGRyZXNzIiBBbGxvd0NyZWF0ZT0idHJ1ZSIvPjxzYW1scDpSZXF1ZXN0ZWRBdXRobkNvbnRleHQgQ29tcGFyaXNvbj0iZXhhY3QiPjxzYW1sOkF1dGhuQ29udGV4dENsYXNzUmVmPnVybjpvYXNpczpuYW1lczp0YzpTQU1MOjIuMDphYzpjbGFzc2VzOlBhc3N3b3JkPC9zYW1sOkF1dGhuQ29udGV4dENsYXNzUmVmPjwvc2FtbHA6UmVxdWVzdGVkQXV0aG5Db250ZXh0PjxTaWduYXR1cmUgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyMiPjxTaWduZWRJbmZvPjxDYW5vbmljYWxpemF0aW9uTWV0aG9kIEFsZ29yaXRobT0iaHR0cDovL3d3dy53My5vcmcvMjAwMS8xMC94bWwtZXhjLWMxNG4jIi8+PFNpZ25hdHVyZU1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNyc2Etc2hhMSIvPjxSZWZlcmVuY2UgVVJJPSIjXzAiPjxUcmFuc2Zvcm1zPjxUcmFuc2Zvcm0gQWxnb3JpdGhtPSJodHRwOi8vd3d3LnczLm9yZy8yMDAxLzEwL3htbC1leGMtYzE0biMiLz48L1RyYW5zZm9ybXM+PERpZ2VzdE1ldGhvZCBBbGdvcml0aG09Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvMDkveG1sZHNpZyNzaGExIi8+PERpZ2VzdFZhbHVlPnRRRGlzQlhLVFErOU9YSk81cjdLdUpnYStLST08L0RpZ2VzdFZhbHVlPjwvUmVmZXJlbmNlPjwvU2lnbmVkSW5mbz48U2lnbmF0dXJlVmFsdWU+b3hSa3ZhdTdVdllnRkVaN1lOQVVOZjMwNjdWN1RuNUM5WFNJaWV0MWFadzJGWWV2Tlc1YlV5LzBteHAzYWo2QXZmRmpubXB6QWI4OEJqZHdBejJCRXJEVG9tUmN1WkI3TGIwZllUZjMxTjJvWk9YME1pUGlRT0g1NEk2M3FKVzRYbzNWcWRGN0dCdUZaWkh5bGxmU0J2N2dmQ3RqSkR3RlNDeldLNzBCOXIzY0ZNUkpaTGhDSjlvUGVuKzRVOXNjU1lPNmcrc3pCWkxsNkFpSjA2UEhjOGp6RUtHd2ZRcmNaazhrREtVbHZOZkpNVUx5cThkcHgyVnZVQXg0cDVld2ZNT3dCOVczSGwzUFBhMGRPNzd6WmlmM0NnbHBjTjA2ZittNlVZRy93bm9UUUV5S1c5aE9lKzJ2R004MFc3N2VXdTBkbWlhUHVxVDFvazhMWFB1cTFBPT08L1NpZ25hdHVyZVZhbHVlPjxLZXlJbmZvPjxYNTA5RGF0YT48WDUwOUNlcnRpZmljYXRlPk1JSURvekNDQW91Z0F3SUJBZ0lKQUtOc21MOFFiZnB3TUEwR0NTcUdTSWIzRFFFQkN3VUFNR2d4Q3pBSkJnTlZCQVlUQWtoTE1SSXdFQVlEVlFRSURBbEliMjVuSUV0dmJtY3hDekFKQmdOVkJBY01Ba2hMTVJNd0VRWURWUVFLREFwdWIyUmxMWE5oYld3eU1TTXdJUVlKS29aSWh2Y05BUWtCRmhSdWIyUmxMbk5oYld3eVFHZHRZV2xzTG1OdmJUQWVGdzB4TlRBM01EVXhOelUyTkRkYUZ3MHhPREEzTURReE56VTJORGRhTUdneEN6QUpCZ05WQkFZVEFraExNUkl3RUFZRFZRUUlEQWxJYjI1bklFdHZibWN4Q3pBSkJnTlZCQWNNQWtoTE1STXdFUVlEVlFRS0RBcHViMlJsTFhOaGJXd3lNU013SVFZSktvWklodmNOQVFrQkZoUnViMlJsTG5OaGJXd3lRR2R0WVdsc0xtTnZiVENDQVNJd0RRWUpLb1pJaHZjTkFRRUJCUUFEZ2dFUEFEQ0NBUW9DZ2dFQkFNUUpBQjhKcnNMUWJVdUphOGFrekxxTzFFWnFDbFMwdFFwK3crNXdndWZwMDdXd0duL3NobWE4ZGNRTmoxZGJqc3pJNUhCZVZGak9LSXhsZmptTkI5b3ZoUVBzdEJqUC9VUFFZcDFJcDJJb0hDWVg5SERnTXozeHlYS2JIdGhVelphRUN6K3ArN1d0Z3doY3pSa0JMRE9tMmsxNXFoUFlHUHcwdkgyemJWUkdXVUJTOWR5Mk1wM3RxbFZiUDB4WjlDRE5raENKa1Y5U01OZm9DVlcvVllQcUsyUUJvN2tpNG9ibTV4NWl4RlFTU0hzS2JWQVJWenlRSDVpTmpGZTFUZEFwM3JEd3JFNUxjMU5RbFFheFI1R25iMk5aQXBET1JSWklWbE52MldVZGk5UXZNMHlDempROTBqUDBPQW9nSGhSWWF4ZzAvdmdORXllNDZoK1BpWTBDQXdFQUFhTlFNRTR3SFFZRFZSME9CQllFRkVWa2pjTEFJVG5ka3kwOTBBeTc0UXFDbVFLSU1COEdBMVVkSXdRWU1CYUFGRVZramNMQUlUbmRreTA5MEF5NzRRcUNtUUtJTUF3R0ExVWRFd1FGTUFNQkFmOHdEUVlKS29aSWh2Y05BUUVMQlFBRGdnRUJBRzRsWVgzS1FYZW5lejRMcERuWmhjRkJFWmk5WXN0VUtQRjVFS2QrV3BscFZiY1RRYzFBMy9aK3VIUm15VjhoK3BRemVGNkxpb2IzN0c4N1lwYWNQcGxKSTY2Y2YyUmo3ajhoU0JOYmRyKzY2RTJxcGNFaEFGMWlKbXpCTnloYi95ZGxFdVZwbjgvRXNvUCtIdkJlaURsNWdvbjM1NjJNelpJZ1YvcExkVGZ4SHlXNmh6QVFoakdxMlVoY3ZSK2dYTlZKdkhQMmVTNGpsSG5Ka0I5YmZvMGt2Zjg3UStENlhLWDNxNWMzbU84dHFXNlVwcUhTQyt1TEVwelppTkxldUZhNFRVSWhnQmdqRGpsUnJOREt1OG5kYW5jU24zeUJIWW5xSjJ0OWNSK2NvRm5uallBQlFwTnJ2azRtdG1YWThTWG9CellHOVkrbHFlQXVuNiswWXlFPTwvWDUwOUNlcnRpZmljYXRlPjwvWDUwOURhdGE+PC9LZXlJbmZvPjwvU2lnbmF0dXJlPjwvc2FtbHA6QXV0aG5SZXF1ZXN0Pg==';

    it('2.1 construt a SAML message signature', function(done) {
        (SamlLib.constructMessageSignature(octetString,_spPrivPem,_spPrivKeyPass).toString('base64')).should.be.equal(signatureB64);
        done();
    });
    it('2.2 verify a SAML message signature (binary)', function(done) {
        var signature = SamlLib.constructMessageSignature(octetString,_spPrivPem,_spPrivKeyPass,false);
        (SamlLib.verifyMessageSignature(SPMetadata,octetString,signature)).should.be.equal(true);
        done();
    });
    it('2.3 verify a SAML message signature (string)', function(done) {
        var signature = SamlLib.constructMessageSignature(octetString,_spPrivPem,_spPrivKeyPass);
        (SamlLib.verifyMessageSignature(SPMetadata,octetString,new Buffer(signature,'base64'))).should.be.equal(true);
        var signature1 = SamlLib.constructMessageSignature('SAMLRequest=nVPfb9owEP5XLL%2BHOKFVwAKkFDQNqVsjwvbQt6tzFEuOnfmclf33MylUSKM87MnS%2Bbv7fvg8I2hNJ8s%2B7O0Gf%2FVIga1Xc44gpvnkXiQqz1RyN3mZJAC7LGmyu3GRTwFEozj7iZ60s3OejwRna6Ie15YC2BBLIrtPRJHkxTYbS1HIfDrKivyZs1Uk0RbC0LkPoZNpapwCs3cU5FiILCVyaa3tq8Fav9onW6P%2FrRVyVnkXnHLmQdsm3s957610QJqkhRZJBiXr8tujjIrkyzuI5Nfttkqqp3rLWUmE%2Fki9dJb6Fv1p9I%2FN43Ux%2BSAGFHF2aI0lOSR2m7g7qeSL2REth2T8Rf%2Ftdjhr5IvPFbUYoIEAs%2FSC4p2vk9%2FjzPWqckarP%2ByL8y2EzymzUTZUdJPsBqjEFrQpm8YjRdulMe5t6RECzvkODGH0lf5LdCY%2F7RE2w1bFnAMeAlu6tgOv6fjoeAAVzuFcopYmet%2Fg7n%2BiuglTUh1Hx3IVjzfnm1Nu19g%2F3F118nF7%2BWkWfwE%3D&SigAlg=http%3A%2F%2Fwww.w3.org%2F2000%2F09%2Fxmldsig%23rsa-sha1',_spPrivPem,_spPrivKeyPass);
        (SamlLib.verifyMessageSignature(SPMetadata,'SAMLRequest=nVPfb9owEP5XLL%2BHOKFVwAKkFDQNqVsjwvbQt6tzFEuOnfmclf33MylUSKM87MnS%2Bbv7fvg8I2hNJ8s%2B7O0Gf%2FVIga1Xc44gpvnkXiQqz1RyN3mZJAC7LGmyu3GRTwFEozj7iZ60s3OejwRna6Ie15YC2BBLIrtPRJHkxTYbS1HIfDrKivyZs1Uk0RbC0LkPoZNpapwCs3cU5FiILCVyaa3tq8Fav9onW6P%2FrRVyVnkXnHLmQdsm3s957610QJqkhRZJBiXr8tujjIrkyzuI5Nfttkqqp3rLWUmE%2Fki9dJb6Fv1p9I%2FN43Ux%2BSAGFHF2aI0lOSR2m7g7qeSL2REth2T8Rf%2Ftdjhr5IvPFbUYoIEAs%2FSC4p2vk9%2FjzPWqckarP%2ByL8y2EzymzUTZUdJPsBqjEFrQpm8YjRdulMe5t6RECzvkODGH0lf5LdCY%2F7RE2w1bFnAMeAlu6tgOv6fjoeAAVzuFcopYmet%2Fg7n%2BiuglTUh1Hx3IVjzfnm1Nu19g%2F3F118nF7%2BWkWfwE%3D&SigAlg=http%3A%2F%2Fwww.w3.org%2F2000%2F09%2Fxmldsig%23rsa-sha1',new Buffer(signature1,'base64'))).should.be.equal(true);
        done();
    });
    it('2.4 construct a SAML signature successfully',function(done){
        fs.writeFileSync('test.txt',SamlLib.constructSAMLSignature(_originRequest,SamlLib.createXPath('Issuer'),SPMetadata.getX509Certificate('signing'),_spPrivPem,_spPrivKeyPass));
        (SamlLib.constructSAMLSignature(_originRequest,SamlLib.createXPath('Issuer'),SPMetadata.getX509Certificate('signing'),_spPrivPem,_spPrivKeyPass)).should.be.equal(dummySignRequest);
        done();
    });
    it('2.5 verify a XML signature from sample using metadata', function(done) {
        (SamlLib.verifySignature(_decodedResponse,_decodedResponseSignature,{
            cert:IdPMetadata
        })).should.be.equal(true);
        done();
    });
    it('2.6 verify a XML signature from sample using keyFile (.cer)', function(done) {
        var xml = fs.readFileSync("./test/metadata/SignSAMLRequest.xml").toString();
        var _decodedRequestDoc = new dom().parseFromString(xml);
        var signature = select(_decodedRequestDoc, "/*/*[local-name(.)='Signature']")[0];
        (SamlLib.verifySignature(xml,signature,{
            keyFile: './test/key/sp/cert.cer'
        })).should.be.equal(true);
        done();
    });
    describe('2.7 High-level extractor',function(){

        describe('2.7.1 get innerText',function(){
            it('2.7.1.1 should return a value',function(done){
                (SamlLib.extractor(_decodedResponse,['NameID']).nameid).should.be.equal('_ce3d2948b4cf20146dee0a0b3dd6f69b6cf86f62d7');
                done();
            });
            it('2.7.1.2 should return undefined',function(done){
                (SamlLib.extractor(_decodedResponse,['notexist']).notexist === undefined).should.equal(true);
                done();
            });
            it('2.7.1.3 should return an array of values',function(done){
                (JSON.stringify(SamlLib.extractor(_decodedResponse,['AttributeValue']))).should.equal(JSON.stringify({"attributevalue":["test","test@example.com","users","examplerole1"]}));
                done();
            });
            it('2.7.1.4 using custom key',function(done){
                (SamlLib.extractor(_decodedResponse,[{
                    localName: 'NameID',
                    customKey: 'nid'
                }]).nid).should.equal('_ce3d2948b4cf20146dee0a0b3dd6f69b6cf86f62d7');
                done();
            });
        });
        describe('2.7.2 get attributes',function(){
            it('2.7.2.1 should return an Object',function(done){
                (JSON.stringify(SamlLib.extractor(_decodedResponse,[{
                    localName: 'Conditions',
                    attributes: ['NotBefore','NotOnOrAfter']
                }]))).should.be.equal(JSON.stringify({"conditions":{"notbefore":"2014-07-17T01:01:18Z","notonorafter":"2024-01-18T06:21:48Z"}}));
                done();
            });
            it('2.7.2.2 should return an array of Objects',function(done){
                (JSON.stringify(SamlLib.extractor(_decodedResponse,[{
                    localName: 'Attribute',
                    attributes: ['Name','NameFormat']
                }]).attribute)).should.be.equal(JSON.stringify([{"name":"uid","nameformat":"urn:oasis:names:tc:SAML:2.0:attrname-format:basic"},{"name":"mail","nameformat":"urn:oasis:names:tc:SAML:2.0:attrname-format:basic"},{"name":"eduPersonAffiliation","nameformat":"urn:oasis:names:tc:SAML:2.0:attrname-format:basic"}]));
                done();
            });
            it('2.7.2.3 non-exist attribute should return undefined',function(done){
                (SamlLib.extractor(_decodedResponse,[{
                    localName: 'Conditions',
                    attributes: ['notexist']
                }]).conditions.notexist === undefined).should.be.equal(true);
                done();
            });
            it('2.7.2.4 non-exist localName should return undefined',function(done){
                (SamlLib.extractor(_decodedResponse,[{
                    localName: 'Condition',
                    attributes: ['notexist']
                }]).condition === undefined).should.be.equal(true);
                done();
            });
            it('2.7.2.5 using custom key',function(done){
                (SamlLib.extractor(_decodedResponse,[{
                    localName: 'Conditions',
                    attributes: ['notexist'],
                    customKey: 'cd'
                }]).cd.notexist === undefined).should.be.equal(true);
                done();
            });
        });
        describe('2.7.3 get entire text',function(){
            it('2.7.3.1 should return a XML string',function(done){
                (JSON.stringify(SamlLib.extractor(_decodedResponse,[{
                    localName: 'Signature',
                    extractEntireBody: true
                }]).signature)).should.be.equal(JSON.stringify("<Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/><SignatureMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#rsa-sha1\"/><Reference URI=\"#_d71a3a8e9fcc45c9e9d248ef7049393fc8f04e5f75\"><Transforms><Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\"/><DigestValue>upUaQyNo8KYfaugAsM9I6e/HYNQ=</DigestValue></Reference></SignedInfo><SignatureValue>T3eM5SxwxP8wH+w1jxH/YezcsC03xU0N19uEggWbL//adCbdvPEWqnYDRlRi6HqdfLTAxqt0LqXzy4Sx2Sj/G3dKA1fTu8qZueqg1oTdKIHEO7BKQlWj+vhsxP4RJwOaooZ195Ez0DsqBjIYM8O+hrmGCpKoJNz7ZaASDhnBBqg4UyilA/VXwP2Wq/LwXdQQ+SfgbtmqxfrcqRQtN87aL3YdPFoS4oR6Q8d97g+YiSbsSvTrxfU5vDEo1tRKxvAQXDDxRBral9kELhqcd3Aumcr9zPF00KxkYIAKtyWd5RsWgOcfbiEQpCit0vh74Y1HplLhzeLhPI/RrLB5gSI4DA==</SignatureValue></Signature>"));
                done();
            });
            it('2.7.3.2 should return undefined',function(done){
                (SamlLib.extractor(_decodedResponse,[{
                    localName: 'Not Exist',
                    extractEntireBody: true
                }]).signature === undefined).should.be.equal(true);
                done();
            });
            it('2.7.3.3 using custom key',function(done){
                (JSON.stringify(SamlLib.extractor(_decodedResponse,[{
                    localName: 'Signature',
                    extractEntireBody: true,
                    customKey: 'cd'
                }]).cd)).should.be.equal(JSON.stringify("<Signature xmlns=\"http://www.w3.org/2000/09/xmldsig#\"><SignedInfo><CanonicalizationMethod Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/><SignatureMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#rsa-sha1\"/><Reference URI=\"#_d71a3a8e9fcc45c9e9d248ef7049393fc8f04e5f75\"><Transforms><Transform Algorithm=\"http://www.w3.org/2001/10/xml-exc-c14n#\"/></Transforms><DigestMethod Algorithm=\"http://www.w3.org/2000/09/xmldsig#sha1\"/><DigestValue>upUaQyNo8KYfaugAsM9I6e/HYNQ=</DigestValue></Reference></SignedInfo><SignatureValue>T3eM5SxwxP8wH+w1jxH/YezcsC03xU0N19uEggWbL//adCbdvPEWqnYDRlRi6HqdfLTAxqt0LqXzy4Sx2Sj/G3dKA1fTu8qZueqg1oTdKIHEO7BKQlWj+vhsxP4RJwOaooZ195Ez0DsqBjIYM8O+hrmGCpKoJNz7ZaASDhnBBqg4UyilA/VXwP2Wq/LwXdQQ+SfgbtmqxfrcqRQtN87aL3YdPFoS4oR6Q8d97g+YiSbsSvTrxfU5vDEo1tRKxvAQXDDxRBral9kELhqcd3Aumcr9zPF00KxkYIAKtyWd5RsWgOcfbiEQpCit0vh74Y1HplLhzeLhPI/RrLB5gSI4DA==</SignatureValue></Signature>"));
                done();
            });
        });
        describe('2.7.4 get key-value pair, attribute value as key, innerText as value',function(){
            it('2.7.4.1 single value should return string',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag:'KeyDescriptor',key:'use'},
                    valueTag: 'X509Certificate'
                }]))).should.be.equal('{"keydescriptor":{"signing":"MIIDozCCAougAwIBAgIJAKNsmL8QbfpwMA0GCSqGSIb3DQEBCwUAMGgxCzAJBgNVBAYTAkhLMRIwEAYDVQQIDAlIb25nIEtvbmcxCzAJBgNVBAcMAkhLMRMwEQYDVQQKDApub2RlLXNhbWwyMSMwIQYJKoZIhvcNAQkBFhRub2RlLnNhbWwyQGdtYWlsLmNvbTAeFw0xNTA3MDUxNzU2NDdaFw0xODA3MDQxNzU2NDdaMGgxCzAJBgNVBAYTAkhLMRIwEAYDVQQIDAlIb25nIEtvbmcxCzAJBgNVBAcMAkhLMRMwEQYDVQQKDApub2RlLXNhbWwyMSMwIQYJKoZIhvcNAQkBFhRub2RlLnNhbWwyQGdtYWlsLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAMQJAB8JrsLQbUuJa8akzLqO1EZqClS0tQp+w+5wgufp07WwGn/shma8dcQNj1dbjszI5HBeVFjOKIxlfjmNB9ovhQPstBjP/UPQYp1Ip2IoHCYX9HDgMz3xyXKbHthUzZaECz+p+7WtgwhczRkBLDOm2k15qhPYGPw0vH2zbVRGWUBS9dy2Mp3tqlVbP0xZ9CDNkhCJkV9SMNfoCVW/VYPqK2QBo7ki4obm5x5ixFQSSHsKbVARVzyQH5iNjFe1TdAp3rDwrE5Lc1NQlQaxR5Gnb2NZApDORRZIVlNv2WUdi9QvM0yCzjQ90jP0OAogHhRYaxg0/vgNEye46h+PiY0CAwEAAaNQME4wHQYDVR0OBBYEFEVkjcLAITndky090Ay74QqCmQKIMB8GA1UdIwQYMBaAFEVkjcLAITndky090Ay74QqCmQKIMAwGA1UdEwQFMAMBAf8wDQYJKoZIhvcNAQELBQADggEBAG4lYX3KQXenez4LpDnZhcFBEZi9YstUKPF5EKd+WplpVbcTQc1A3/Z+uHRmyV8h+pQzeF6Liob37G87YpacPplJI66cf2Rj7j8hSBNbdr+66E2qpcEhAF1iJmzBNyhb/ydlEuVpn8/EsoP+HvBeiDl5gon3562MzZIgV/pLdTfxHyW6hzAQhjGq2UhcvR+gXNVJvHP2eS4jlHnJkB9bfo0kvf87Q+D6XKX3q5c3mO8tqW6UpqHSC+uLEpzZiNLeuFa4TUIhgBgjDjlRrNDKu8ndancSn3yBHYnqJ2t9cR+coFnnjYABQpNrvk4mtmXY8SXoBzYG9Y+lqeAun6+0YyE="}}');
                done();
            });
            it('2.7.4.2 multiple values should return array consists of multiple string',function(done){
                (JSON.stringify(SamlLib.extractor(_decodedResponse,[{
                    localName: {tag:'Attribute',key:'Name'},
                    valueTag: 'AttributeValue'
                }]))).should.be.equal('{"attribute":{"uid":"test","mail":"test@example.com","eduPersonAffiliation":["users","examplerole1"]}}');
                done();
            });
            it('2.7.4.3 non-exist key should return undefined',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag:'KeyDescriptor',key:'used'},
                    valueTag: 'X509Certificate'
                }])).keydescriptor === undefined).should.be.equal(true);
                done();
            });
            it('2.7.4.4 non-exist value should return undefined',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag:'KeyDescriptor',key:'use'},
                    valueTag: 'X123Certificate'
                }])).keydescriptor === undefined).should.be.equal(true);
                done();
            });
            it('2.7.4.5 non-exist tag should return undefined',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag:'KeyDescription',key:'encrypt'},
                    valueTag: 'X509Certificate'
                }])).keydescriptor === undefined).should.be.equal(true);
                done();
            });
            it('2.7.4.6 using custom key',function(done){
                (JSON.stringify(SamlLib.extractor(_decodedResponse,[{
                    localName: {tag:'Attribute',key:'Name'},
                    valueTag: 'AttributeValue',
                    customKey: 'kd'
                }]).kd)).should.be.equal('{"uid":"test","mail":"test@example.com","eduPersonAffiliation":["users","examplerole1"]}');
                done();
            });
        });
        describe('2.7.5 get key-value pair, attribute as key, attribute as value',function(){
            it('2.7.5.1 single value should return array consists of one object',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag: 'AssertionConsumerService', key: 'isDefault'},
                    attributeTag: 'index'
                }]).assertionconsumerservice)).should.be.equal('[{"true":"0"}]');
                done();
            });
            it('2.7.5.2 multiple values should return array consists of multiple objects',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag: 'SingleLogoutService', key: 'Binding'},
                    attributeTag: 'Location'
                }]).singlelogoutservice)).should.be.equal('[{"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect":"https://sp.example.org/sp/slo"},{"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST":"https://sp.example.org/sp/slo"}]');
                done();
            });
            it('2.7.5.3 non-exist tag should return undefined',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag:'SingleLogoutServices',key:'Binding'},
                    attributeTag: 'Location'
                }])).singlelogoutservice === undefined).should.be.equal(true);
                done();
            });
            it('2.7.5.4 non-exist key should return undefined',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag:'SingleLogoutService',key:'Winding'},
                    attributeTag: 'Location'
                }])).singlelogoutservice === undefined).should.be.equal(true);
                done();
            });
            it('2.7.5.5 non-exist attributeTag should return undefined',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag:'SingleLogoutService',key:'Binding'},
                    attributeTag: 'NoSuchLocation'
                }])).singlelogoutservice === undefined).should.be.equal(true);
                done();
            });
            it('2.7.5.6 using custom key',function(done){
                (JSON.stringify(SamlLib.extractor(SPMetadata.xmlString,[{
                    localName: {tag: 'SingleLogoutService', key: 'Binding'},
                    attributeTag: 'Location',
                    customKey: 'slo'
                }]).slo)).should.be.equal('[{"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-Redirect":"https://sp.example.org/sp/slo"},{"urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST":"https://sp.example.org/sp/slo"}]');
                done();
            });
        });
    });
});
