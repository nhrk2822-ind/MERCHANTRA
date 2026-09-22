
// HTTP handlers for /products.
//
// Owns product CRUD and the Permanent Product ID assignment on create.
// Timeline reads (product_events) are exposed here too since they're
// naturally viewed per-product, but the writes to product_events belong
// to LifecycleService, called from every OTHER controller/service that
// causes a lifecycle event — not from here.
 
#pragma once
 
#include <drogon/HttpController.h>
#include "../../auth/AuthFilter.h"
 
namespace merchantra {
 
class ProductController : public drogon::HttpController<ProductController, false> {
public:
    METHOD_LIST_BEGIN
    ADD_METHOD_TO(ProductController::listProducts, "/products", drogon::Get, "merchantra::AuthFilter");
    ADD_METHOD_TO(ProductController::createProduct, "/products", drogon::Post, "merchantra::AuthFilter");
    ADD_METHOD_TO(ProductController::getProduct, "/products/{permanentId}", drogon::Get, "merchantra::AuthFilter");
    ADD_METHOD_TO(ProductController::updateProduct, "/products/{permanentId}", drogon::Patch, "merchantra::AuthFilter");
    ADD_METHOD_TO(ProductController::getTimeline, "/products/{permanentId}/timeline", drogon::Get, "merchantra::AuthFilter");
    METHOD_LIST_END
 
    void listProducts(const drogon::HttpRequestPtr &req,
                       std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    void createProduct(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback);
 
    void getProduct(const drogon::HttpRequestPtr &req,
                     std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                     std::string permanentId);
 
    void updateProduct(const drogon::HttpRequestPtr &req,
                        std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                        std::string permanentId);
 
    void getTimeline(const drogon::HttpRequestPtr &req,
                      std::function<void(const drogon::HttpResponsePtr &)> &&callback,
                      std::string permanentId);
};
 
}  // namespace merchantra
 
