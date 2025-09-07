import requests
import sys
import json
from datetime import datetime

class FundasDePatinAPITester:
    def __init__(self, base_url="https://practica-espanol-2.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.created_product_id = None
        self.created_carrito_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}{endpoint}"
        if headers is None:
            headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(response_data) < 10:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_root_endpoint(self):
        """Test root API endpoint"""
        return self.run_test("Root API Endpoint", "GET", "/", 200)

    def test_categorias(self):
        """Test categories endpoint"""
        success, response = self.run_test("Get Categories", "GET", "/categorias", 200)
        if success and 'categorias' in response:
            categorias = response['categorias']
            expected_categories = ['artisticos', 'hockey', 'velocidad', 'recreativos']
            found_categories = [cat['value'] for cat in categorias]
            if all(cat in found_categories for cat in expected_categories):
                print(f"   ✅ All expected categories found: {found_categories}")
            else:
                print(f"   ⚠️ Missing categories. Expected: {expected_categories}, Found: {found_categories}")
        return success

    def test_productos_sin_auth(self):
        """Test products endpoint without authentication"""
        success, response = self.run_test("Get Products (No Auth)", "GET", "/productos", 200)
        if success and isinstance(response, list):
            print(f"   Found {len(response)} products")
            if len(response) >= 6:
                print(f"   ✅ Expected 6+ products found")
            else:
                print(f"   ⚠️ Expected at least 6 products, found {len(response)}")
        return success

    def test_admin_login(self):
        """Test admin login"""
        login_data = {
            "email": "admin@fundasdepatin.com",
            "password": "admin123"
        }
        success, response = self.run_test("Admin Login", "POST", "/auth/login", 200, data=login_data)
        if success and 'access_token' in response:
            self.admin_token = response['access_token']
            user_info = response.get('user', {})
            if user_info.get('rol') == 'admin':
                print(f"   ✅ Admin login successful, role: {user_info.get('rol')}")
            else:
                print(f"   ⚠️ Login successful but role is: {user_info.get('rol')}")
        return success

    def test_admin_estadisticas(self):
        """Test admin statistics endpoint"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        success, response = self.run_test("Admin Statistics", "GET", "/admin/estadisticas", 200, headers=headers)
        if success:
            expected_keys = ['total_productos', 'total_usuarios', 'total_pedidos', 'ventas_mes']
            if all(key in response for key in expected_keys):
                print(f"   ✅ All statistics keys present")
            else:
                print(f"   ⚠️ Missing statistics keys")
        return success

    def test_create_producto(self):
        """Test creating a product (admin only)"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False

        producto_data = {
            "nombre": "Funda Test Artística Premium",
            "descripcion": "Funda de prueba para patines artísticos con materiales premium",
            "precio": 29.99,
            "categoria": "artisticos",
            "tallas_disponibles": ["S", "M", "L", "XL"],
            "colores_disponibles": ["Negro", "Rosa", "Azul"],
            "material": "Neopreno premium",
            "stock": 50,
            "caracteristicas": ["Resistente al agua", "Acolchado interno", "Cierre con velcro"]
        }
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        success, response = self.run_test("Create Product", "POST", "/productos", 200, data=producto_data, headers=headers)
        if success and 'id' in response:
            self.created_product_id = response['id']
            print(f"   ✅ Product created with ID: {self.created_product_id}")
        return success

    def test_get_producto_by_id(self):
        """Test getting a specific product"""
        if not self.created_product_id:
            print("❌ No product ID available")
            return False
        
        success, response = self.run_test("Get Product by ID", "GET", f"/productos/{self.created_product_id}", 200)
        if success and response.get('id') == self.created_product_id:
            print(f"   ✅ Product retrieved successfully")
        return success

    def test_filter_productos_by_categoria(self):
        """Test filtering products by category"""
        success, response = self.run_test("Filter Products by Category", "GET", "/productos", 200, params={"categoria": "artisticos"})
        if success and isinstance(response, list):
            if all(producto.get('categoria') == 'artisticos' for producto in response):
                print(f"   ✅ All {len(response)} products are from 'artisticos' category")
            else:
                print(f"   ⚠️ Some products don't match the category filter")
        return success

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime("%H%M%S")
        user_data = {
            "nombre": f"Usuario Test {timestamp}",
            "email": f"test{timestamp}@fundasdepatin.com",
            "password": "testpass123",
            "telefono": "123456789",
            "direccion": "Calle Test 123",
            "ciudad": "Madrid",
            "codigo_postal": "28001"
        }
        
        success, response = self.run_test("User Registration", "POST", "/auth/register", 200, data=user_data)
        if success and 'id' in response:
            print(f"   ✅ User registered with ID: {response['id']}")
            # Now login with the new user
            login_data = {
                "email": user_data["email"],
                "password": user_data["password"]
            }
            login_success, login_response = self.run_test("User Login", "POST", "/auth/login", 200, data=login_data)
            if login_success and 'access_token' in login_response:
                self.user_token = login_response['access_token']
                print(f"   ✅ User login successful")
        return success

    def test_create_carrito(self):
        """Test creating a shopping cart"""
        if not self.created_product_id:
            print("❌ No product ID available for cart")
            return False

        carrito_data = {
            "items": [
                {
                    "producto_id": self.created_product_id,
                    "cantidad": 2,
                    "talla": "M",
                    "color": "Negro"
                }
            ]
        }
        
        success, response = self.run_test("Create Cart", "POST", "/carrito", 200, data=carrito_data)
        if success and 'id' in response:
            self.created_carrito_id = response['id']
            total = response.get('total', 0)
            print(f"   ✅ Cart created with ID: {self.created_carrito_id}, Total: €{total}")
        return success

    def test_get_carrito(self):
        """Test getting a shopping cart"""
        if not self.created_carrito_id:
            print("❌ No cart ID available")
            return False
        
        success, response = self.run_test("Get Cart", "GET", f"/carrito/{self.created_carrito_id}", 200)
        if success and response.get('id') == self.created_carrito_id:
            print(f"   ✅ Cart retrieved successfully, Total: €{response.get('total', 0)}")
        return success

    def test_create_pedido(self):
        """Test creating an order"""
        if not self.created_carrito_id:
            print("❌ No cart ID available for order")
            return False

        pedido_data = {
            "carrito_id": self.created_carrito_id,
            "metodo_pago": "stripe",
            "datos_cliente": {
                "nombre": "Cliente Test",
                "email": "cliente@test.com",
                "telefono": "123456789",
                "direccion": "Calle Test 123",
                "ciudad": "Madrid",
                "codigo_postal": "28001"
            }
        }
        
        success, response = self.run_test("Create Order", "POST", "/pedidos", 200, data=pedido_data)
        if success and 'id' in response:
            print(f"   ✅ Order created with ID: {response['id']}")
        return success

    def test_stripe_checkout_creation(self):
        """Test Stripe checkout session creation"""
        if not self.created_carrito_id:
            print("❌ No cart ID available for checkout")
            return False

        pago_data = {
            "carrito_id": self.created_carrito_id,
            "metodo": "stripe"
        }
        
        success, response = self.run_test("Create Stripe Checkout", "POST", "/pagos/checkout", 200, data=pago_data)
        if success and 'checkout_url' in response and 'session_id' in response:
            print(f"   ✅ Stripe checkout session created")
            print(f"   Session ID: {response['session_id']}")
        return success

    def test_get_pedidos_admin(self):
        """Test getting orders as admin"""
        if not self.admin_token:
            print("❌ No admin token available")
            return False
        
        headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {self.admin_token}'
        }
        success, response = self.run_test("Get Orders (Admin)", "GET", "/pedidos", 200, headers=headers)
        if success and isinstance(response, list):
            print(f"   ✅ Retrieved {len(response)} orders")
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Fundas de Patín API Tests")
        print(f"🌐 Base URL: {self.base_url}")
        print("=" * 60)

        # Basic API tests
        self.test_root_endpoint()
        self.test_categorias()
        self.test_productos_sin_auth()

        # Authentication tests
        self.test_admin_login()
        self.test_admin_estadisticas()
        self.test_user_registration()

        # Product management tests
        self.test_create_producto()
        self.test_get_producto_by_id()
        self.test_filter_productos_by_categoria()

        # Shopping cart and order tests
        self.test_create_carrito()
        self.test_get_carrito()
        self.test_create_pedido()
        self.test_get_pedidos_admin()

        # Payment tests
        self.test_stripe_checkout_creation()

        # Print results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} tests passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed! Backend API is working correctly.")
            return 0
        else:
            failed_tests = self.tests_run - self.tests_passed
            print(f"❌ {failed_tests} tests failed. Please check the issues above.")
            return 1

def main():
    tester = FundasDePatinAPITester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())