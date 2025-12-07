import { Injectable } from "@angular/core";
import { HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from "@angular/common/http";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { JwtAuthService } from "../services/auth/jwt-auth.service";
import { CorrelationIdService } from "../services/correlation-id.service";

@Injectable()
export class TokenInterceptor implements HttpInterceptor {

  constructor(
    private jwtAuth: JwtAuthService,
    private correlationId: CorrelationIdService
  ) {}

  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const token = this.jwtAuth.token || this.jwtAuth.getJwtToken();
    const headers: Record<string, string> = {
      "X-Request-Id": this.correlationId.getCorrelationId()
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const changedReq = req.clone({
      setHeaders: headers,
    });
    
    // 🆕 NEW FEATURE: Listen for new token in response headers
    return next.handle(changedReq).pipe(
      tap((event: HttpEvent<any>) => {
        // Check if response contains a new token
        if (event instanceof HttpResponse) {
          const newToken = event.headers.get("X-New-Token");
          const responseCorrelationId = event.headers.get("X-Request-Id");
          if (responseCorrelationId) {
            this.correlationId.rotateCorrelationId(responseCorrelationId);
          }
          
          if (newToken) {
            // Update token in service and localStorage
            this.jwtAuth.token = newToken;
            this.jwtAuth.setUserAndToken(
              newToken,
              this.jwtAuth.user,
              true
            );
            
            console.log('🔄 Token auto-refreshed - session extended');
          }
        }
      })
    );
  }
}
